cmake_minimum_required(VERSION 3.13)
project(voicemod_native)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find React Native headers
if(DEFINED ENV{REACT_NATIVE_DIR})
    set(RN_DIR $ENV{REACT_NATIVE_DIR})
else()
    set(RN_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../../node_modules/react-native")
endif()

set(JSI_DIR "${RN_DIR}/ReactCommon/jsi")
set(REACT_COMMON_DIR "${RN_DIR}/ReactCommon")

# Include directories
include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/jsi
    ${JSI_DIR}
    ${REACT_COMMON_DIR}
)

# Source files
set(SOURCES
    cpp/VoiceModEngine.cpp
    cpp/BiquadFilter.cpp
    cpp/PitchShifter.cpp
    cpp/ReverbEngine.cpp
    cpp/Spatializer.cpp
    cpp/PanSystem.cpp
    cpp/Limiter.cpp
    cpp/LFO.cpp
    jsi/VoiceModHostModule.cpp
)

# Build shared library
add_library(voicemod_native SHARED ${SOURCES})

# Link React Native JSI
target_link_libraries(voicemod_native
    jsi
    react_nativemodule_core
    fbjni
)

# Platform-specific settings
if(ANDROID)
    target_link_libraries(voicemod_native
        android
        log
    )

    # Add Android-specific source
    target_sources(voicemod_native PRIVATE
        android/src/main/java/com/voicemod/VoiceModModule.cpp
    )
endif()

if(APPLE)
    find_library(ACCELERATE_FRAMEWORK Accelerate)
    target_link_libraries(voicemod_native
        ${ACCELERATE_FRAMEWORK}
    )
endif()
