# Interactive Camera Controls

## ✅ NEW: Live Adjustments in Preview Window!

The face tracker now has **interactive sliders** in the preview window to adjust brightness, contrast, and exposure in real-time!

## How It Works

When you run the face tracker, you'll see **3 sliders at the bottom of the preview window**:

1. **Brightness** slider (0-100)
   - Adjusts software brightness multiplier (0.0-3.0)
   - Drag right = brighter
   - Drag left = darker

2. **Contrast** slider (0-100)
   - Adjusts contrast multiplier (0.0-3.0)
   - Drag right = more contrast
   - Drag left = less contrast

3. **Exposure** slider (0-100)
   - Adjusts camera exposure (-13 to 1)
   - Higher = brighter exposure
   - Lower = darker exposure

## Using the Controls

### Real-Time Adjustment

1. **Run the face tracker**:
   ```bash
   cd face-tracker/build/bin
   ./face-tracker
   ```

2. **See the preview window** with your webcam feed

3. **Look for sliders** at the bottom of the window

4. **Drag sliders** to adjust:
   - Move sliders left/right
   - Preview updates instantly
   - See current values displayed at bottom of preview

5. **Settings save automatically** when you press 'Q' or ESC to quit

### What You'll See

In the preview window:
- **Top left**: Pan/Tilt DMX values (cyan text)
- **Bottom**: Current Brightness and Contrast values (yellow text)
- **Bottom of window**: Three interactive sliders:
  - Brightness
  - Contrast  
  - Exposure

## Settings Auto-Save

When you adjust the sliders and then quit (press 'Q' or ESC):
- ✅ Settings are automatically saved to `face-tracker-config.json`
- ✅ Next time you run, your preferred settings load automatically
- ✅ No need to edit config files manually!

## Tips

- **Bright camera**: Increase Brightness slider (try 70-100)
- **Dark camera**: Increase Brightness slider AND Exposure slider
- **Better image quality**: Adjust Contrast slider (try 40-60)
- **Fine-tuning**: Make small adjustments and watch the preview

## Manual Override

You can still edit `face-tracker-config.json` manually:
```json
{
  "brightness": 2.0,
  "contrast": 1.3,
  "cameraExposure": -1,
  "autoExposure": true
}
```

These values will load when you start, and then you can adjust with sliders.

## Keyboard Controls

- **Q** or **ESC**: Quit and save settings

Enjoy your interactive DMX puppet show! 🎭✨

