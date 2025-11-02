cmake_minimum_required(VERSION 3.12)
project(ArtBastardFaceTracker)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find required packages
find_package(OpenCV REQUIRED)
find_package(CURL REQUIRED)
find_package(PkgConfig REQUIRED)

# Find nlohmann_json (header-only)
# Try to find it in standard locations
find_path(JSON_INCLUDE_DIR nlohmann/json.hpp
    PATHS
        /usr/include
        /usr/local/include
        /opt/homebrew/include
        ${CMAKE_SOURCE_DIR}/third_party
    NO_DEFAULT_PATH
)

# If not found, try with default paths
if(NOT JSON_INCLUDE_DIR)
    find_path(JSON_INCLUDE_DIR nlohmann/json.hpp)
endif()

# Check if found
if(NOT JSON_INCLUDE_DIR)
    message(FATAL_ERROR "nlohmann/json.hpp not found. Please install it via package manager:\n"
        "  Ubuntu/Debian: sudo apt-get install nlohmann-json3-dev\n"
        "  Arch/CachyOS: sudo pacman -S nlohmann-json\n"
        "  macOS: brew install nlohmann-json")
else()
    message(STATUS "Found nlohmann/json at: ${JSON_INCLUDE_DIR}")
endif()

# Include directories
include_directories(
    ${OpenCV_INCLUDE_DIRS}
    ${CURL_INCLUDE_DIRS}
    ${JSON_INCLUDE_DIR}
)

# Source files
set(SOURCES
    main.cpp
)

# Executable
add_executable(face-tracker ${SOURCES})

# Link libraries
# Filter out optional OpenCV modules that may have missing dependencies (viz, hdf)
# We only need core face tracking modules for face detection
set(FILTERED_OPENCV_LIBS "")
foreach(lib ${OpenCV_LIBS})
    # Exclude modules that require external dependencies we don't need
    if(NOT lib MATCHES "opencv_viz" 
       AND NOT lib MATCHES "opencv_hdf")
        list(APPEND FILTERED_OPENCV_LIBS ${lib})
    endif()
endforeach()

# Use only essential OpenCV modules for face tracking
# Explicitly link only what we need to avoid dependency issues
target_link_libraries(face-tracker
    opencv_core
    opencv_imgproc
    opencv_imgcodecs
    opencv_highgui
    opencv_videoio
    opencv_objdetect
    opencv_face
    ${CURL_LIBRARIES}
)

# Compiler options
target_compile_options(face-tracker PRIVATE
    -Wall
    -Wextra
    -O3
)

# Output directory
set_target_properties(face-tracker PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin
)

message(STATUS "OpenCV version: ${OpenCV_VERSION}")
message(STATUS "OpenCV include dirs: ${OpenCV_INCLUDE_DIRS}")
message(STATUS "OpenCV libraries: ${OpenCV_LIBS}")
message(STATUS "CURL libraries: ${CURL_LIBRARIES}")

