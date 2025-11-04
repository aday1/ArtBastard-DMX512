use anyhow::{Context, Result};
use opencv::{
    core::{Point2f, Point, Rect, Scalar, Size, CV_8UC3, Vector, AlgorithmHint},
    imgproc::{self, COLOR_BGR2GRAY, equalize_hist, FONT_HERSHEY_SIMPLEX},
    objdetect::CascadeClassifier,
    prelude::*,
    videoio::{VideoCapture, CAP_PROP_FRAME_WIDTH, CAP_PROP_FRAME_HEIGHT, CAP_PROP_FPS, CAP_ANY},
    highgui::{self, WINDOW_AUTOSIZE},
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::time::{Duration, Instant};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Config {
    #[serde(default = "default_dmx_api_url")]
    dmx_api_url: String,
    #[serde(default = "default_int_1")]
    pan_channel: u8,
    #[serde(default = "default_int_2")]
    tilt_channel: u8,
    #[serde(default)]
    iris_channel: u8,
    #[serde(default)]
    zoom_channel: u8,
    #[serde(default)]
    focus_channel: u8,
    #[serde(default)]
    camera_index: i32,
    #[serde(default = "default_int_30")]
    update_rate: u32,
    #[serde(default = "default_float_1_0")]
    pan_sensitivity: f32,
    #[serde(default = "default_float_1_0")]
    tilt_sensitivity: f32,
    #[serde(default = "default_int_128")]
    pan_offset: u8,
    #[serde(default = "default_int_128")]
    tilt_offset: u8,
    #[serde(default = "default_int_128")]
    iris_value: u8,
    #[serde(default = "default_int_128")]
    zoom_value: u8,
    #[serde(default = "default_int_128")]
    focus_value: u8,
    #[serde(default = "default_bool_true")]
    show_preview: bool,
    #[serde(default = "default_float_0_85")]
    smoothing_factor: f32,
    #[serde(default = "default_float_5_0")]
    max_velocity: f32,
    #[serde(default = "default_float_1_0")]
    brightness: f32,
    #[serde(default = "default_float_1_0")]
    contrast: f32,
    #[serde(default = "default_int_neg_1")]
    camera_exposure: i32,
    #[serde(default = "default_int_neg_1")]
    camera_brightness: i32,
    #[serde(default = "default_bool_true")]
    auto_exposure: bool,
}

fn default_dmx_api_url() -> String {
    "http://localhost:3030/api/dmx/batch".to_string()
}
fn default_int_1() -> u8 { 1 }
fn default_int_2() -> u8 { 2 }
fn default_int_30() -> u32 { 30 }
fn default_int_128() -> u8 { 128 }
fn default_int_neg_1() -> i32 { -1 }
fn default_float_1_0() -> f32 { 1.0 }
fn default_float_0_85() -> f32 { 0.85 }
fn default_float_5_0() -> f32 { 5.0 }
fn default_bool_true() -> bool { true }

impl Default for Config {
    fn default() -> Self {
        Config {
            dmx_api_url: default_dmx_api_url(),
            pan_channel: 1,
            tilt_channel: 2,
            iris_channel: 0,
            zoom_channel: 0,
            focus_channel: 0,
            camera_index: 0,
            update_rate: 30,
            pan_sensitivity: 1.0,
            tilt_sensitivity: 1.0,
            pan_offset: 128,
            tilt_offset: 128,
            iris_value: 128,
            zoom_value: 128,
            focus_value: 128,
            show_preview: true,
            smoothing_factor: 0.85,
            max_velocity: 5.0,
            brightness: 1.0,
            contrast: 1.0,
            camera_exposure: -1,
            camera_brightness: -1,
            auto_exposure: true,
        }
    }
}

struct FaceTrackerState {
    face_cascade: CascadeClassifier,
    landmarks: Vec<Point2f>,
    head_center: Point2f,
    current_pan: f32,
    current_tilt: f32,
    smoothed_pan: f32,
    smoothed_tilt: f32,
    pan_velocity: f32,
    tilt_velocity: f32,
    face_detected: bool,
    config: Config,
}

impl FaceTrackerState {
    fn new(config: Config) -> Result<Self> {
        // Load face cascade classifier
        let cascade_paths = vec![
            "haarcascade_frontalface_alt.xml",
            "../haarcascade_frontalface_alt.xml",
            "../../haarcascade_frontalface_alt.xml",
        ];
        
        let mut face_cascade = None;
        for path in &cascade_paths {
            if std::path::Path::new(path).exists() {
                face_cascade = Some(
                    CascadeClassifier::new(path)
                        .context(format!("Failed to load cascade from {}", path))?
                );
                println!("Loaded face cascade from: {}", path);
                break;
            }
        }
        
        let face_cascade = face_cascade.ok_or_else(|| {
            anyhow::anyhow!(
                "Could not find haarcascade_frontalface_alt.xml in any of: {:?}",
                cascade_paths
            )
        })?;
        
        Ok(FaceTrackerState {
            face_cascade,
            landmarks: Vec::new(),
            head_center: Point2f::new(0.0, 0.0),
            current_pan: 0.0,
            current_tilt: 0.0,
            smoothed_pan: 0.0,
            smoothed_tilt: 0.0,
            pan_velocity: 0.0,
            tilt_velocity: 0.0,
            face_detected: false,
            config,
        })
    }
}

fn load_config(path: &str) -> Result<Config> {
    if std::path::Path::new(path).exists() {
        let content = fs::read_to_string(path)
            .context(format!("Failed to read config file: {}", path))?;
        let config: Config = serde_json::from_str(&content)
            .context(format!("Failed to parse config file: {}", path))?;
        Ok(config)
    } else {
        println!("Config file not found, creating default: {}", path);
        let config = Config::default();
        let json = serde_json::to_string_pretty(&config)?;
        fs::write(path, json)
            .context(format!("Failed to write config file: {}", path))?;
        Ok(config)
    }
}

fn save_config(config: &Config, path: &str) -> Result<()> {
    let json = serde_json::to_string_pretty(config)?;
    fs::write(path, json)
        .context(format!("Failed to write config file: {}", path))?;
    Ok(())
}

fn adjust_brightness_contrast(
    src: &Mat,
    dst: &mut Mat,
    brightness: f32,
    contrast: f32,
) -> Result<()> {
    src.convert_to(dst, CV_8UC3, contrast as f64, ((brightness - 1.0) * 127.0) as f64)?;
    Ok(())
}

fn smooth_with_velocity(
    current: &mut f32,
    target: f32,
    velocity: &mut f32,
    smoothing: f32,
    max_velocity: f32,
) {
    let diff = target - *current;
    *velocity = *velocity * smoothing + diff * (1.0 - smoothing);
    *velocity = velocity.clamp(-max_velocity, max_velocity);
    *current += *velocity;
}

fn estimate_head_pose(landmarks: &[Point2f], image_size: Size, pan: &mut f32, tilt: &mut f32) {
    if landmarks.len() < 68 {
        return;
    }
    
    // Key facial landmark indices (for 68-point model)
    let left_eye = landmarks[36];
    let right_eye = landmarks[45];
    
    // Calculate face center
    let face_center = Point2f::new(
        (left_eye.x + right_eye.x) / 2.0,
        (left_eye.y + right_eye.y) / 2.0,
    );
    
    // Calculate image center
    let image_center = Point2f::new(
        image_size.width as f32 / 2.0,
        image_size.height as f32 / 2.0,
    );
    
    // Pan (horizontal) - based on face center offset from image center
    let pan_offset = (face_center.x - image_center.x) / image_center.x;
    *pan = pan_offset;
    
    // Tilt (vertical) - based on face center offset from image center
    let tilt_offset = (face_center.y - image_center.y) / image_center.y;
    *tilt = tilt_offset;
    
    // Optional: Use eye alignment for better pan estimation
    let eye_vector = Point2f::new(right_eye.x - left_eye.x, right_eye.y - left_eye.y);
    let eye_angle = (eye_vector.y / eye_vector.x).atan();
    *pan = *pan * 0.7 + (eye_angle / std::f32::consts::PI) * 0.3;
}

fn map_to_dmx(pan: f32, tilt: f32, config: &Config) -> (u8, u8) {
    // Apply sensitivity
    let pan_val = pan * config.pan_sensitivity;
    let tilt_val = tilt * config.tilt_sensitivity;
    
    // Map from -1.0..1.0 to 0..255 with offset
    let pan_dmx = ((pan_val * 127.0) as i32 + config.pan_offset as i32)
        .clamp(0, 255) as u8;
    let tilt_dmx = ((tilt_val * 127.0) as i32 + config.tilt_offset as i32)
        .clamp(0, 255) as u8;
    
    (pan_dmx, tilt_dmx)
}

fn send_dmx_values(config: &Config, pan_value: u8, tilt_value: u8) -> Result<()> {
    let mut updates = HashMap::new();
    updates.insert(config.pan_channel.to_string(), pan_value);
    updates.insert(config.tilt_channel.to_string(), tilt_value);
    
    if config.iris_channel > 0 {
        updates.insert(config.iris_channel.to_string(), config.iris_value);
    }
    if config.zoom_channel > 0 {
        updates.insert(config.zoom_channel.to_string(), config.zoom_value);
    }
    if config.focus_channel > 0 {
        updates.insert(config.focus_channel.to_string(), config.focus_value);
    }
    
    let client = reqwest::blocking::Client::new();
    let response = client
        .post(&config.dmx_api_url)
        .json(&updates)
        .send()
        .context("Failed to send DMX update")?;
    
    if !response.status().is_success() {
        eprintln!("DMX API returned error: {}", response.status());
    }
    
    Ok(())
}

fn track_face(mut cap: VideoCapture, mut state: FaceTrackerState) -> Result<()> {
    let mut frame = Mat::default();
    let mut gray = Mat::default();
    let mut adjusted = Mat::default();
    
    // Create preview window
    if state.config.show_preview {
        highgui::named_window("ArtBastard Face Tracker", WINDOW_AUTOSIZE)?;
    }
    
    let update_interval = Duration::from_millis(1000 / state.config.update_rate as u64);
    let mut last_update = Instant::now();
    
    println!("Starting face tracking...");
    println!("Press 'q' or ESC to quit");
    
    loop {
        if !cap.read(&mut frame)? || frame.empty() {
            eprintln!("Failed to capture frame");
            break;
        }
        
        // Apply brightness/contrast adjustments
        adjust_brightness_contrast(&frame, &mut adjusted, state.config.brightness, state.config.contrast)?;
        
        // Convert to grayscale
        imgproc::cvt_color(&adjusted, &mut gray, COLOR_BGR2GRAY, 0, AlgorithmHint::ALGO_HINT_DEFAULT)?;
        let mut gray_eq = gray.clone();
        equalize_hist(&gray, &mut gray_eq)?;
        gray = gray_eq;
        
        // Detect faces
        let mut faces = Vector::<Rect>::new();
        state.face_cascade.detect_multi_scale(
            &gray,
            &mut faces,
            1.1,
            3,
            0,
            Size::new(50, 50),
            Size::new(0, 0),
        )?;
        
        if faces.len() > 0 {
            state.face_detected = true;
            let face_rect = faces.get(0).context("Failed to get face rect")?;
            
            // Use face center for basic tracking (landmarks not implemented without contrib)
            let face_center = Point2f::new(
                face_rect.x as f32 + face_rect.width as f32 / 2.0,
                face_rect.y as f32 + face_rect.height as f32 / 2.0,
            );
            
            let image_center = Point2f::new(
                frame.cols() as f32 / 2.0,
                frame.rows() as f32 / 2.0,
            );
            
            let pan = (face_center.x - image_center.x) / image_center.x;
            let tilt = (face_center.y - image_center.y) / image_center.y;
            
            // Apply smoothing
            smooth_with_velocity(
                &mut state.smoothed_pan,
                pan,
                &mut state.pan_velocity,
                state.config.smoothing_factor,
                state.config.max_velocity / 127.0,
            );
            smooth_with_velocity(
                &mut state.smoothed_tilt,
                tilt,
                &mut state.tilt_velocity,
                state.config.smoothing_factor,
                state.config.max_velocity / 127.0,
            );
            
            // Map to DMX values
            let (pan_value, tilt_value) = map_to_dmx(state.smoothed_pan, state.smoothed_tilt, &state.config);
            
            // Send DMX update at configured rate
            let now = Instant::now();
            if now.duration_since(last_update) >= update_interval {
                send_dmx_values(&state.config, pan_value, tilt_value)?;
                last_update = now;
                
                println!("Face tracked - Pan: {}, Tilt: {} (raw: {:.2}, {:.2})",
                    pan_value, tilt_value, state.smoothed_pan, state.smoothed_tilt);
            }
            
            // Draw on preview
            if state.config.show_preview {
                // Draw face rectangle
                imgproc::rectangle(
                    &mut adjusted,
                    face_rect,
                    Scalar::new(0.0, 165.0, 255.0, 0.0),
                    3,
                    8,
                    0,
                )?;
                
                // Draw face center
                imgproc::circle(
                    &mut adjusted,
                    Point::new(face_center.x as i32, face_center.y as i32),
                    5,
                    Scalar::new(0.0, 255.0, 255.0, 0.0),
                    -1,
                    8,
                    0,
                )?;
                
                // Draw text with pan/tilt values
                let text = format!("Pan: {}  Tilt: {}", pan_value, tilt_value);
                imgproc::put_text(
                    &mut adjusted,
                    &text,
                    Point::new(10, 30),
                    FONT_HERSHEY_SIMPLEX,
                    0.7,
                    Scalar::new(255.0, 255.0, 0.0, 0.0),
                    2,
                    8,
                    false,
                )?;
            }
        } else {
            state.face_detected = false;
        }
        
        // Show preview
        if state.config.show_preview {
            highgui::imshow("ArtBastard Face Tracker", &adjusted)?;
            
            let key = highgui::wait_key(1)?;
            if key == 'q' as i32 || key == 27 {
                // ESC or 'q'
                break;
            }
        }
    }
    
    Ok(())
}

fn main() -> Result<()> {
    println!("=== ArtBastard DMX Face Tracker ===");
    println!("OpenCV Face Tracking for Moving Head Control");
    println!("====================================");
    
    // Load configuration
    let config_path = "face-tracker-config.json";
    let config = load_config(config_path)?;
    
    println!("Configuration loaded:");
    println!("  DMX API URL: {}", config.dmx_api_url);
    println!("  Pan Channel: {}", config.pan_channel);
    println!("  Tilt Channel: {}", config.tilt_channel);
    println!("  Camera Index: {}", config.camera_index);
    println!("  Update Rate: {} Hz", config.update_rate);
    println!("  Show Preview: {}", config.show_preview);
    println!();
    
    // Initialize state
    let state = FaceTrackerState::new(config.clone())?;
    
    // Open camera
    let mut cap = VideoCapture::new(config.camera_index, CAP_ANY)?;
    if !cap.is_opened()? {
        anyhow::bail!("Failed to open camera {}", config.camera_index);
    }
    
    // Set camera properties
    cap.set(CAP_PROP_FRAME_WIDTH, 640.0)?;
    cap.set(CAP_PROP_FRAME_HEIGHT, 480.0)?;
    cap.set(CAP_PROP_FPS, 30.0)?;
    
    println!("Camera opened successfully");
    println!("Starting face tracking...");
    println!();
    
    // Run tracking loop
    track_face(cap, state)?;
    
    // Save config on exit
    save_config(&config, config_path)?;
    
    println!("Face tracker exited.");
    Ok(())
}

