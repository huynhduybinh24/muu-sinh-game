package com.muusinh.game;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileInputStream;
import java.io.OutputStream;

/** System document picker; writes only the destination the user explicitly chooses. */
@CapacitorPlugin(name = "FileExport")
public class FileExportPlugin extends Plugin {
    private File sourceFile(PluginCall call) throws Exception {
        Uri uri = Uri.parse(call.getString("uri", ""));
        if (!"file".equals(uri.getScheme()) || uri.getPath() == null) throw new IllegalArgumentException("Invalid file URI");
        File file = new File(uri.getPath()).getCanonicalFile();
        File root = new File(getContext().getCacheDir(), "muu-sinh-exports").getCanonicalFile();
        if (!file.getPath().startsWith(root.getPath() + File.separator) || !file.isFile()) throw new IllegalArgumentException("Invalid export source");
        return file;
    }

    @PluginMethod
    public void save(PluginCall call) {
        String filename = call.getString("filename", "");
        if (!filename.matches("[a-zA-Z0-9][a-zA-Z0-9_-]*\\.(png|json)")) { call.reject("Invalid filename"); return; }
        try {
            sourceFile(call);
            Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
            intent.addCategory(Intent.CATEGORY_OPENABLE);
            intent.setType(filename.endsWith(".png") ? "image/png" : "application/json");
            intent.putExtra(Intent.EXTRA_TITLE, filename);
            startActivityForResult(call, intent, "documentCreated");
        } catch (Exception error) { call.reject("Cannot open document picker", error); }
    }

    @ActivityCallback
    private void documentCreated(PluginCall call, ActivityResult result) {
        if (call == null) return;
        JSObject response = new JSObject();
        if (result.getResultCode() == Activity.RESULT_CANCELED) { response.put("saved", false); call.resolve(response); return; }
        Uri destination = result.getData() == null ? null : result.getData().getData();
        if (result.getResultCode() != Activity.RESULT_OK || destination == null) { call.reject("Missing document destination"); return; }
        try (FileInputStream input = new FileInputStream(sourceFile(call));
             OutputStream output = getContext().getContentResolver().openOutputStream(destination, "w")) {
            if (output == null) throw new IllegalStateException("Document is not writable");
            byte[] buffer = new byte[8192];
            int count;
            while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
            output.flush();
            response.put("saved", true);
            call.resolve(response);
        } catch (Exception error) { call.reject("Cannot save document", error); }
    }
}
