package expo.modules.smsretriever

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Build
import android.util.Base64
import androidx.core.content.ContextCompat
import com.google.android.gms.auth.api.phone.SmsRetriever
import com.google.android.gms.common.api.CommonStatusCodes
import com.google.android.gms.common.api.Status
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.nio.charset.StandardCharsets
import java.security.MessageDigest

/**
 * Reads the sign-in SMS without asking for SMS permission.
 *
 * Google's SMS Retriever hands the app any message that ends with this app's
 * 11-character hash, for five minutes after `start()`. The app sends that hash
 * with its code request, so the server can put it at the end of the SMS.
 */
class SmsRetrieverModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private var receiver: BroadcastReceiver? = null

  /** A message that arrived before the code screen was listening. */
  private var pending: String? = null

  override fun definition() = ModuleDefinition {
    Name("SmsRetriever")

    Events("onSms")

    Function("getAppHash") {
      appHash(context)
    }

    AsyncFunction("start") {
      stopListening()
      pending = null
      val ctx = context
      val r = object : BroadcastReceiver() {
        override fun onReceive(c: Context?, intent: Intent?) {
          if (intent?.action != SmsRetriever.SMS_RETRIEVED_ACTION) return
          val extras = intent.extras ?: return
          @Suppress("DEPRECATION")
          val status = extras.get(SmsRetriever.EXTRA_STATUS) as? Status ?: return
          if (status.statusCode == CommonStatusCodes.SUCCESS) {
            val message = extras.getString(SmsRetriever.EXTRA_SMS_MESSAGE) ?: return
            pending = message
            sendEvent("onSms", mapOf("message" to message))
          }
          // One message per start(): the retriever stops after delivering or timing out.
          stopListening()
        }
      }
      ContextCompat.registerReceiver(
        ctx,
        r,
        IntentFilter(SmsRetriever.SMS_RETRIEVED_ACTION),
        SmsRetriever.SEND_PERMISSION,
        null,
        ContextCompat.RECEIVER_EXPORTED,
      )
      receiver = r
      SmsRetriever.getClient(ctx).startSmsRetriever()
      true
    }

    Function("takePending") {
      val message = pending
      pending = null
      message
    }

    Function("stop") {
      stopListening()
    }

    OnDestroy {
      stopListening()
    }
  }

  private fun stopListening() {
    val r = receiver ?: return
    receiver = null
    try {
      appContext.reactContext?.unregisterReceiver(r)
    } catch (_: IllegalArgumentException) {
      // Already unregistered.
    }
  }

  /** The 11-character hash Google computes from the package name and signing key. */
  private fun appHash(ctx: Context): String? {
    val pm = ctx.packageManager
    val pkg = ctx.packageName
    val signatures = try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        pm.getPackageInfo(pkg, PackageManager.GET_SIGNING_CERTIFICATES).signingInfo?.apkContentsSigners
      } else {
        @Suppress("DEPRECATION")
        pm.getPackageInfo(pkg, PackageManager.GET_SIGNATURES).signatures
      }
    } catch (_: PackageManager.NameNotFoundException) {
      null
    } ?: return null

    val signature = signatures.firstOrNull() ?: return null
    val digest = MessageDigest.getInstance("SHA-256")
    digest.update("$pkg ${signature.toCharsString()}".toByteArray(StandardCharsets.UTF_8))
    val truncated = digest.digest().copyOfRange(0, 9)
    return Base64.encodeToString(truncated, Base64.NO_PADDING or Base64.NO_WRAP).substring(0, 11)
  }
}
