package com.lobsterstudio.app;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Environment;
import android.webkit.JavascriptInterface;
import android.widget.Toast;

public class AndroidBridge {
    private Activity activity;
    
    public AndroidBridge(Activity activity) {
        this.activity = activity;
    }
    
    @JavascriptInterface
    public String getPlatform() {
        return "android";
    }
    
    @JavascriptInterface
    public void shareText(String text) {
        Intent sendIntent = new Intent();
        sendIntent.setAction(Intent.ACTION_SEND);
        sendIntent.putExtra(Intent.EXTRA_TEXT, text);
        sendIntent.setType("text/plain");
        activity.startActivity(Intent.createChooser(sendIntent, "分享到"));
    }
    
    @JavascriptInterface
    public void shareFile(String filePath) {
        Uri fileUri = Uri.parse(filePath);
        Intent shareIntent = new Intent(Intent.ACTION_SEND);
        shareIntent.putExtra(Intent.EXTRA_STREAM, fileUri);
        shareIntent.setType("video/*");
        activity.startActivity(Intent.createChooser(shareIntent, "分享视频"));
    }
    
    @JavascriptInterface
    public String getExternalStorageDir() {
        return Environment.getExternalStorageDirectory().getAbsolutePath();
    }
    
    @JavascriptInterface
    public void showToast(String message) {
        activity.runOnUiThread(() -> 
            Toast.makeText(activity, message, Toast.LENGTH_SHORT).show()
        );
    }
}
