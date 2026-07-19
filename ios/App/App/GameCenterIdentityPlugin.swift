import Foundation
import GameKit
import Capacitor

@objc(GameCenterIdentityPlugin)
public class GameCenterIdentityPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "GameCenterIdentityPlugin"
    public let jsName = "GameCenterIdentity"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "authenticate", returnType: CAPPluginReturnPromise)
    ]

    @objc func authenticate(_ call: CAPPluginCall) {
        let player = GKLocalPlayer.local
        player.authenticateHandler = { [weak self] viewController, error in
            if let viewController = viewController {
                DispatchQueue.main.async {
                    self?.bridge?.viewController?.present(viewController, animated: true)
                }
                return
            }
            if let error = error {
                call.reject("Game Center authentication failed", nil, error)
                return
            }
            guard player.isAuthenticated else {
                call.reject("Game Center authentication was declined")
                return
            }
            player.generateIdentityVerificationSignature { publicKeyURL, signature, salt, timestamp, error in
                if let error = error {
                    call.reject("Unable to create Game Center identity signature", nil, error)
                    return
                }
                guard let publicKeyURL = publicKeyURL, let signature = signature, let salt = salt else {
                    call.reject("Game Center returned incomplete identity data")
                    return
                }
                call.resolve([
                    "gamePlayerID": player.gamePlayerID,
                    "bundleID": Bundle.main.bundleIdentifier ?? "",
                    "publicKeyUrl": publicKeyURL.absoluteString,
                    "signature": signature.base64EncodedString(),
                    "salt": salt.base64EncodedString(),
                    "timestamp": timestamp
                ])
            }
        }
    }
}
