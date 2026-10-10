package expo.modules.geolocation

import android.content.Context
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Handler
import android.os.Looper
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class EchoesGeolocationModule : Module() {
  private val handler = Handler(Looper.getMainLooper())

  override fun definition() = ModuleDefinition {
    Name("EchoesGeolocation")

    AsyncFunction("getCurrentPositionAsync") { options: Map<String, Any?>, promise: Promise ->
      val context = appContext.reactContext
        ?: return@AsyncFunction promise.reject("E_LOCATION_CONTEXT", "Android context is unavailable", null)
      val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
      val providers = listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER)
        .filter { provider -> locationManager.isProviderEnabled(provider) }

      if (providers.isEmpty()) {
        return@AsyncFunction promise.reject("E_LOCATION_UNAVAILABLE", "No location provider is enabled", null)
      }

      val lastKnown = providers
        .mapNotNull { provider -> locationManager.getLastKnownLocation(provider) }
        .maxByOrNull { location -> location.time }

      if (lastKnown != null) {
        return@AsyncFunction promise.resolve(locationToMap(lastKnown))
      }

      val timeout = (options["timeout"] as? Number)?.toLong()?.coerceAtLeast(1000L) ?: 10000L
      var settled = false
      val listener = object : LocationListener {
        override fun onLocationChanged(location: Location) {
          if (settled) return
          settled = true
          handler.removeCallbacksAndMessages(this)
          locationManager.removeUpdates(this)
          promise.resolve(locationToMap(location))
        }

        override fun onProviderDisabled(provider: String) {
          if (providers.all { !locationManager.isProviderEnabled(it) } && !settled) {
            settled = true
            handler.removeCallbacksAndMessages(this)
            locationManager.removeUpdates(this)
            promise.reject("E_LOCATION_UNAVAILABLE", "No location provider is enabled", null)
          }
        }
      }

      try {
        providers.forEach { provider ->
          locationManager.requestLocationUpdates(provider, 0L, 0f, listener, Looper.getMainLooper())
        }
        handler.postDelayed({
          if (settled) return@postDelayed
          settled = true
          locationManager.removeUpdates(listener)
          promise.reject("E_LOCATION_TIMEOUT", "Timed out waiting for a location", null)
        }, timeout)
      } catch (error: SecurityException) {
        promise.reject("E_LOCATION_PERMISSION", "Location permission was not granted", error)
      } catch (error: Exception) {
        promise.reject("E_LOCATION_FAILED", "Unable to read device location", error)
      }
    }
  }

  private fun locationToMap(location: Location): Map<String, Any> = mapOf(
    "coords" to mapOf(
      "latitude" to location.latitude,
      "longitude" to location.longitude,
      "altitude" to location.altitude,
      "accuracy" to location.accuracy.toDouble(),
      "heading" to location.bearing.toDouble(),
      "speed" to location.speed.toDouble()
    ),
    "timestamp" to location.time
  )
}
