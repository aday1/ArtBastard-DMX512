# 🔍 MIDI to DMX Debug Guide

## 🚨 Issue Investigation

I've added comprehensive debug logging to track down why MIDI controls aren't updating DMX channels.

## 🧰 Debug Steps

### **1. Open Browser Developer Console**
- Press `F12` or right-click → "Inspect" → "Console" tab
- Clear any existing console messages

### **2. Test MIDI Learning**
1. **Learn a MIDI Control**:
   - Click "M" button next to a control (e.g., Dimmer)
   - Move a MIDI fader/knob to learn it
   - Check console for learning confirmation

2. **Test MIDI Input**:
   - Move the learned MIDI control
   - **Check console output** - you should see debug messages like:

```
MIDI triggered for dimmer: value=64, scaled=127
getAffectedFixtures called - selectionMode: fixtures
Selected channels: 0 []
Selected fixtures: 1 ["fixture-id-123"]
Selected groups: 0 []
applyControl called: type=dimmer, value=127, fixtures=1
Setting DMX channel 1 to 127 for dimmer
```

### **3. Check for Common Issues**

#### **A. No Fixtures Selected**
If you see:
```
getAffectedFixtures called - selectionMode: fixtures
Selected fixtures: 0 []
applyControl called: type=dimmer, value=127, fixtures=0
```
**Solution**: Select fixtures first!
- Go to "Fixtures" tab
- Select one or more fixtures
- Or use channel selection mode

#### **B. Wrong Selection Mode**
If you see:
```
getAffectedFixtures called - selectionMode: channels
Selected channels: 0 []
```
**Solution**: Switch selection mode
- Try "Fixtures" mode and select fixtures
- Or use "Channels" mode and select specific DMX channels

#### **C. No Target Channel Found**
If you see:
```
No target channel found for dimmer in fixture 0 {pan: 5, tilt: 6}
```
**Solution**: Channel mapping issue
- Check if fixture has the expected channel type
- Dimmer might be named "intensity" or "master" instead

#### **D. Channel Mapping Issues**
Check the fixture channels object in console:
```
{pan: 5, tilt: 6, red: 7, green: 8, blue: 9}
```
If "dimmer" is missing but fixture should have it, the fixture definition needs updating.

## 🎯 **Most Likely Causes**

1. **No Fixtures Selected** (90% of cases)
   - Solution: Select fixtures in the fixtures panel first

2. **Wrong Selection Mode** 
   - Solution: Use "Fixtures" mode for fixture controls

3. **Channel Name Mismatch**
   - Expected: "dimmer" 
   - Actual: "intensity", "master", etc.

## 🔧 **Quick Fix Steps**

### **Step 1: Ensure Fixture Selection**
1. Go to the main fixtures panel
2. Click on one or more fixtures to select them
3. Verify they appear highlighted/selected

### **Step 2: Check Selection Mode**
In Super Control panel, make sure:
- Selection mode is set to "Fixtures" (not "Channels")
- OR if using "Channels" mode, select specific DMX channels first

### **Step 3: Test Again**
1. Move MIDI control
2. Watch console for debug messages
3. Report what you see

## 📊 **Debug Console Output Examples**

### **Working Case:**
```
MIDI triggered for dimmer: value=100, scaled=196
getAffectedFixtures called - selectionMode: fixtures  
Selected fixtures: 1 ["moving-head-1"]
applyControl called: type=dimmer, value=196, fixtures=1
Setting DMX channel 1 to 196 for dimmer
```

### **No Fixtures Selected:**
```
MIDI triggered for dimmer: value=100, scaled=196
getAffectedFixtures called - selectionMode: fixtures
Selected fixtures: 0 []
applyControl called: type=dimmer, value=196, fixtures=0
```

### **Channel Not Found:**
```
MIDI triggered for dimmer: value=100, scaled=196  
getAffectedFixtures called - selectionMode: fixtures
Selected fixtures: 1 ["moving-head-1"]
applyControl called: type=dimmer, value=196, fixtures=1
No target channel found for dimmer in fixture 0 {pan: 1, tilt: 2, red: 3}
```

## 🎭 **Next Steps**

1. **Run the debug test** as described above
2. **Copy/paste the console output** from your test
3. **Report what you see** - this will tell us exactly what's wrong

The debug logging will reveal whether it's:
- A fixture selection issue
- A channel mapping problem  
- A DMX output issue
- Something else entirely

🔍 **Ready to debug - check your browser console!**
