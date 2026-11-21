import Foundation
import Network

/// Tiny loopback HTTP server that serves the bundled Coach web UI with
/// COOP/COEP headers so WebLLM / Kokoro can use SharedArrayBuffer.
final class CoachStaticServer: @unchecked Sendable {
    static let shared = CoachStaticServer()

    private let lock = NSLock()
    private var _port: UInt16?
    private var listener: NWListener?
    private let queue = DispatchQueue(label: "achieve.coach.static-server")

    var port: UInt16? {
        lock.lock(); defer { lock.unlock() }
        return _port
    }

    var baseURL: URL? {
        guard let port else { return nil }
        return URL(string: "http://127.0.0.1:\(port)/engine.html")
    }

    func startIfNeeded() throws {
        lock.lock()
        let already = listener != nil && _port != nil
        lock.unlock()
        if already { return }

        let params = NWParameters.tcp
        params.allowLocalEndpointReuse = true

        let listener = try NWListener(using: params, on: .any)
        self.listener = listener

        let group = DispatchGroup()
        group.enter()

        listener.stateUpdateHandler = { [weak self] state in
            guard let self else { return }
            if case .ready = state {
                self.lock.lock()
                self._port = self.listener?.port?.rawValue
                self.lock.unlock()
                group.leave()
            }
        }

        listener.newConnectionHandler = { [weak self] connection in
            self?.handle(connection)
        }

        listener.start(queue: queue)

        let waited = group.wait(timeout: .now() + 2)
        if waited == .timedOut || port == nil {
            throw CoachServerError.portUnavailable
        }
    }

    func stop() {
        listener?.cancel()
        listener = nil
        lock.lock()
        _port = nil
        lock.unlock()
    }

    private func handle(_ connection: NWConnection) {
        connection.start(queue: queue)
        receive(on: connection, buffer: Data())
    }

    private func receive(on connection: NWConnection, buffer: Data) {
        connection.receive(minimumIncompleteLength: 1, maximumLength: 64 * 1024) { [weak self] data, _, isComplete, error in
            guard let self else { return }
            if error != nil {
                connection.cancel()
                return
            }

            var next = buffer
            if let data { next.append(data) }

            if let range = next.range(of: Data("\r\n\r\n".utf8)) {
                let headerData = next.subdata(in: next.startIndex..<range.lowerBound)
                let request = String(data: headerData, encoding: .utf8) ?? ""
                self.respond(to: request, on: connection)
                return
            }

            if isComplete {
                connection.cancel()
                return
            }

            self.receive(on: connection, buffer: next)
        }
    }

    private func respond(to request: String, on connection: NWConnection) {
        let firstLine = request.split(separator: "\r\n", maxSplits: 1).first.map(String.init) ?? ""
        let parts = firstLine.split(separator: " ")
        let method = parts.first.map(String.init) ?? "GET"
        var path = parts.count > 1 ? String(parts[1]) : "/"
        if path == "/" { path = "/engine.html" }
        if let q = path.firstIndex(of: "?") {
            path = String(path[..<q])
        }

        guard method == "GET" || method == "HEAD" else {
            send(status: 405, contentType: "text/plain", body: Data("Method Not Allowed".utf8), on: connection)
            return
        }

        guard let fileURL = resourceURL(for: path),
              let body = try? Data(contentsOf: fileURL) else {
            send(status: 404, contentType: "text/plain", body: Data("Not Found".utf8), on: connection)
            return
        }

        send(
            status: 200,
            contentType: mimeType(for: fileURL.pathExtension),
            body: method == "HEAD" ? Data() : body,
            contentLength: body.count,
            on: connection
        )
    }

    private func resourceURL(for path: String) -> URL? {
        let cleaned = path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        let root = Bundle.main.resourceURL?.appendingPathComponent("CoachWeb")

        if cleaned.isEmpty {
            return root?.appendingPathComponent("engine.html")
        }

        if let root {
            let candidate = root.appendingPathComponent(cleaned)
            if FileManager.default.fileExists(atPath: candidate.path) {
                return candidate
            }
        }

        // Fallback for flattened resource copies.
        let ns = cleaned as NSString
        let ext = ns.pathExtension
        let base = ns.deletingPathExtension
        let file = (base as NSString).lastPathComponent
        return Bundle.main.url(forResource: file, withExtension: ext.isEmpty ? nil : ext, subdirectory: "CoachWeb")
            ?? Bundle.main.url(forResource: file, withExtension: ext.isEmpty ? nil : ext)
    }

    private func mimeType(for ext: String) -> String {
        switch ext.lowercased() {
        case "html": return "text/html; charset=utf-8"
        case "js", "mjs": return "text/javascript; charset=utf-8"
        case "css": return "text/css; charset=utf-8"
        case "json": return "application/json"
        case "svg": return "image/svg+xml"
        case "wasm": return "application/wasm"
        case "png": return "image/png"
        case "jpg", "jpeg": return "image/jpeg"
        case "woff2": return "font/woff2"
        default: return "application/octet-stream"
        }
    }

    private func send(
        status: Int,
        contentType: String,
        body: Data,
        contentLength: Int? = nil,
        on connection: NWConnection
    ) {
        let reason: String
        switch status {
        case 200: reason = "OK"
        case 404: reason = "Not Found"
        case 405: reason = "Method Not Allowed"
        default: reason = "Error"
        }
        let length = contentLength ?? body.count
        var header = "HTTP/1.1 \(status) \(reason)\r\n"
        header += "Content-Type: \(contentType)\r\n"
        header += "Content-Length: \(length)\r\n"
        header += "Cache-Control: no-cache\r\n"
        header += "Cross-Origin-Opener-Policy: same-origin\r\n"
        header += "Cross-Origin-Embedder-Policy: credentialless\r\n"
        header += "Cross-Origin-Resource-Policy: cross-origin\r\n"
        header += "Connection: close\r\n\r\n"

        var payload = Data(header.utf8)
        payload.append(body)
        connection.send(content: payload, completion: .contentProcessed { _ in
            connection.cancel()
        })
    }
}

enum CoachServerError: Error {
    case portUnavailable
}
