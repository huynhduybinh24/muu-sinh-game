package com.muusinh.game;

import static org.junit.Assert.*;

import android.content.ComponentName;
import android.content.Context;
import android.content.pm.ActivityInfo;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.os.Build;
import android.view.WindowManager;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.io.InputStream;
import org.junit.Test;
import org.junit.runner.RunWith;

/** Requires an actual emulator/device. Not part of npm's browser/unit checks. */
@RunWith(AndroidJUnit4.class)
public class AndroidFoundationTest {
    private final Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();

    @Test
    public void packageAndBundledOfflineShell() throws Exception {
        assertEquals("com.muusinh.game", context.getPackageName());
        try (InputStream shell = context.getAssets().open("public/index.html")) {
            assertTrue(shell.read() >= 0);
        }
        assertTrue(context.getAssets().list("public/assets").length > 0);
    }

    @Test
    public void portraitAndKeyboardResize() throws Exception {
        ActivityInfo activity = context.getPackageManager().getActivityInfo(new ComponentName(context, MainActivity.class), 0);
        assertEquals(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT, activity.screenOrientation);
        assertEquals(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE,
            activity.softInputMode & WindowManager.LayoutParams.SOFT_INPUT_MASK_ADJUST);
    }

    @Test
    public void classifiedAsGame() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) assertEquals(ApplicationInfo.CATEGORY_GAME, context.getApplicationInfo().category);
    }

    @Test
    public void noBroadStoragePermissions() throws Exception {
        String[] permissions = context.getPackageManager().getPackageInfo(context.getPackageName(), PackageManager.GET_PERMISSIONS).requestedPermissions;
        if (permissions != null) for (String permission : permissions) {
            assertNotEquals("android.permission.WRITE_EXTERNAL_STORAGE", permission);
            assertNotEquals("android.permission.READ_EXTERNAL_STORAGE", permission);
            assertNotEquals("android.permission.MANAGE_EXTERNAL_STORAGE", permission);
        }
    }
}
