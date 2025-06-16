# 🔧 Enhanced MIDI-DMX Debug & Auto-Addressing Guide

## 🎯 **NEW FEATURES ADDED**

### ✅ **Auto-OSC Address Assignment**
- Automatically assigns OSC addresses when fixtures are selected
- Format: `/fixture/{fixture-id}/{channel-type}`
- Console logging shows all assignments

### ✅ **Enhanced Debug Section**
- **Auto-Select First Fixture**: Instantly selects the first available fixture
- **Check Selection**: Shows current selection state in console
- **Test DMX Channel 1**: Direct DMX output test

### ✅ **Comprehensive Logging**
- DMX channel setting with verification
- OSC address auto-assignment logging
- Fixture selection debugging

## 🧪 **Step-by-Step Testing**

### **Step 1: Open Browser Console**
- Press `F12` → Console tab
- Clear existing messages

### **Step 2: Quick Setup**
1. **Auto-Select Fixture**:
   - Click "Auto-Select First Fixture" button in debug section
   - Console should show: `[DEBUG] Auto-selected first fixture: {name} ({id})`

2. **Verify Selection**:
   - Click "Check Selection" button
   - Console should show affected fixtures and selection mode

### **Step 3: Test Direct DMX**
1. **Test DMX Output**:
   - Click "Test DMX Channel 1" button
   - Console should show: `[DEBUG] Testing DMX output - setting channel 1 to 127`
   - Check if DMX hardware/software shows channel 1 = 127

### **Step 4: Test MIDI to DMX**
1. **Learn MIDI Control**:
   - Click "M" button next to Dimmer
   - Move a MIDI fader/knob
   - Verify MIDI learning successful

2. **Test MIDI Control**:
   - Move the learned MIDI fader
   - **Watch console for these messages**:

```
[OSC] Auto-assigned: /fixture/{id}/dimmer → DMX channel {X}
[DMX] Setting channel {X} to {value} for dimmer
[DMX] Verification: Channel {X} is now {value} (expected {value})
```

## 🔍 **Expected Console Output**

### **Successful Case:**
```
[DEBUG] Auto-selected first fixture: Moving Head 1 (fixture-123)
[OSC] Auto-assigning addresses for fixture: Moving Head 1 (fixture-123)
[OSC] Fixture channels: {dimmer: 1, pan: 2, tilt: 3, red: 4, green: 5, blue: 6}
[OSC] Start address: 1
[OSC] Auto-assigned: /fixture/fixture-123/dimmer → DMX channel 1
[OSC] Auto-assigned: /fixture/fixture-123/pan → DMX channel 2
[OSC] Auto-assigned: /fixture/fixture-123/tilt → DMX channel 3
[OSC] Auto-assigned: /fixture/fixture-123/red → DMX channel 4
[OSC] Auto-assigned: /fixture/fixture-123/green → DMX channel 5
[OSC] Auto-assigned: /fixture/fixture-123/blue → DMX channel 6

MIDI triggered for dimmer: value=100, scaled=196
[DMX] Setting channel 1 to 196 for dimmer
[DMX] Verification: Channel 1 is now 196 (expected 196)
```

### **Problem Cases:**

#### **No Fixtures Available:**
```
[DEBUG] No fixtures found to auto-select
[OSC] No fixtures selected for auto-assignment
```
**Solution**: Add fixtures to the system first

#### **DMX Not Updating:**
```
[DMX] Setting channel 1 to 196 for dimmer
[DMX] Verification: Channel 1 is now 0 (expected 196)
```
**Solution**: DMX backend/hardware issue - check API connectivity

#### **Channel Not Found:**
```
[DMX] ERROR: No target channel found for dimmer in fixture 0 {pan: 2, tilt: 3}
```
**Solution**: Fixture doesn't have a "dimmer" channel type

## 🎛️ **OSC Address Auto-Assignment**

### **Format**
- **Dimmer**: `/fixture/{fixture-id}/dimmer`
- **Pan**: `/fixture/{fixture-id}/pan`
- **Tilt**: `/fixture/{fixture-id}/tilt`
- **Colors**: `/fixture/{fixture-id}/red`, `/fixture/{fixture-id}/green`, `/fixture/{fixture-id}/blue`
- **Effects**: `/fixture/{fixture-id}/gobo`, `/fixture/{fixture-id}/shutter`, etc.

### **Benefits**
- **Automatic**: No manual OSC address configuration needed
- **Consistent**: Predictable address structure
- **Professional**: Industry-standard `/fixture/` hierarchy
- **Scalable**: Works with multiple fixtures automatically

## 🚨 **Common Issues & Solutions**

### **Issue 1: MIDI Learning Works but No DMX**
**Symptoms**: MIDI learns successfully, console shows triggers, but no DMX output
**Check**: 
- Console for `[DMX] Setting channel X to Y` messages
- DMX verification messages showing actual vs expected values
**Solution**: If DMX setting messages appear but verification fails, it's a backend/hardware issue

### **Issue 2: No Fixtures Selected**
**Symptoms**: Console shows `Selected fixtures: 0 []`
**Solution**: 
- Click "Auto-Select First Fixture" button
- Or manually select fixtures in the fixtures list

### **Issue 3: Channel Type Mismatch**
**Symptoms**: `No target channel found for dimmer`
**Check**: Console logs showing fixture channels object
**Solution**: Fixture might use "intensity" instead of "dimmer" - update channel mapping

### **Issue 4: OSC Only, No DMX**
**Symptoms**: OSC addresses assigned but DMX channels not updating
**Check**: 
- DMX API connectivity (`/api/dmx` endpoint)
- Backend server running and responding
- DMX hardware/software receiving data

## 🎯 **Action Items**

1. **Test the Debug Buttons**: Use the new debug section to quickly test functionality
2. **Check Console Output**: All DMX operations now have detailed logging
3. **Verify Auto-OSC**: Fixture selection automatically assigns OSC addresses
4. **Test DMX Pipeline**: Direct DMX test button verifies the entire pipeline

## 🔧 **Next Steps Based on Results**

### **If Direct DMX Test Works**
- Issue is in MIDI→DMX connection
- Check MIDI learning and applyControl function

### **If Direct DMX Test Fails**
- Issue is in DMX backend/hardware
- Check `/api/dmx` endpoint and server logs

### **If MIDI Triggers but No DMX**
- Issue is in fixture selection or channel mapping
- Use "Check Selection" button to debug

---

## 🎭 **Enhanced Debugging Ready**

The system now has comprehensive debugging tools and auto-OSC addressing. Test with the new debug buttons and check console output to identify exactly where the MIDI→DMX pipeline is failing!

🔍 **Debug, test, and report what you see in the console!**
