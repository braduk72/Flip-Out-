package uk.gizmogames.flipout;

import android.content.pm.ActivityInfo;
import android.content.res.Configuration;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final int TABLET_SMALLEST_WIDTH_DP = 600;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        applyOrientationPolicy(getResources().getConfiguration());
    }

    @Override
    public void onConfigurationChanged(Configuration configuration) {
        super.onConfigurationChanged(configuration);
        applyOrientationPolicy(configuration);
    }

    private void applyOrientationPolicy(Configuration configuration) {
        boolean isTablet = configuration.smallestScreenWidthDp >= TABLET_SMALLEST_WIDTH_DP;
        setRequestedOrientation(isTablet
            ? ActivityInfo.SCREEN_ORIENTATION_FULL_USER
            : ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT);
    }
}
