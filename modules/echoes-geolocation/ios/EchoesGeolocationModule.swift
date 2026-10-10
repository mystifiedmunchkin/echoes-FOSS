import CoreLocation
import ExpoModulesCore

public class EchoesGeolocationModule: Module {
  private let locationManager = CLLocationManager()
  private var permissionContinuation: CheckedContinuation<[String: Any], Never>?
  private var locationContinuation: CheckedContinuation<[String: Any], Error>?

  public func definition() -> ModuleDefinition {
    Name("EchoesGeolocation")

    AsyncFunction("requestForegroundPermissionsAsync") { () async -> [String: Any] in
      let status = locationManager.authorizationStatus
      if status == .notDetermined {
        return await withCheckedContinuation { continuation in
          permissionContinuation = continuation
          locationManager.delegate = self
          locationManager.requestWhenInUseAuthorization()
        }
      }
      return permissionResult(status)
    }

    AsyncFunction("getCurrentPositionAsync") { (options: [String: Any]) async throws -> [String: Any] in
      let timeout = (options["timeout"] as? Double ?? 10000) / 1000
      return try await withThrowingTaskGroup(of: [String: Any].self) { group in
        group.addTask {
          try await self.currentLocation()
        }
        group.addTask {
          try await Task.sleep(for: .seconds(timeout))
          throw LocationError.timeout
        }
        guard let result = try await group.next() else {
          throw LocationError.unavailable
        }
        group.cancelAll()
        return result
      }
    }
  }

  private func currentLocation() async throws -> [String: Any] {
    guard CLLocationManager.locationServicesEnabled() else {
      throw LocationError.unavailable
    }
    locationManager.delegate = self
    return try await withCheckedThrowingContinuation { continuation in
      locationContinuation = continuation
      locationManager.requestLocation()
    }
  }

  private func permissionResult(_ status: CLAuthorizationStatus) -> [String: Any] {
    let isGranted = status == .authorizedWhenInUse || status == .authorizedAlways
    return [
      "status": isGranted ? "granted" : "denied",
      "granted": isGranted,
      "canAskAgain": status == .notDetermined
    ]
  }

  private enum LocationError: Error {
    case timeout
    case unavailable
  }

  func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
    guard let location = locations.last, let continuation = locationContinuation else { return }
    locationContinuation = nil
    continuation.resume(returning: [
      "coords": [
        "latitude": location.coordinate.latitude,
        "longitude": location.coordinate.longitude,
        "altitude": location.altitude,
        "accuracy": location.horizontalAccuracy,
        "heading": location.course,
        "speed": location.speed
      ],
      "timestamp": location.timestamp.timeIntervalSince1970 * 1000
    ])
  }

  func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
    guard let continuation = locationContinuation else { return }
    locationContinuation = nil
    continuation.resume(throwing: error)
  }
}

extension EchoesGeolocationModule: CLLocationManagerDelegate {
  public func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
    guard let continuation = permissionContinuation else { return }
    permissionContinuation = nil
    continuation.resume(returning: permissionResult(manager.authorizationStatus))
  }
}
