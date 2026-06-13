#import <React/RCTBridgeModule.h>
#import <React/RCTUtils.h>
#import <Foundation/Foundation.h>

#include "../native/cpp/VoiceModEngine.h"

@interface VoiceModModule : NSObject <RCTBridgeModule>
@end

@implementation VoiceModModule {
    std::unique_ptr<voicemod::VoiceModEngine> _engine;
    bool _initialized;
}

RCT_EXPORT_MODULE(VoiceMod)

- (instancetype)init {
    self = [super init];
    if (self) {
        _engine = std::make_unique<voicemod::VoiceModEngine>();
        _initialized = false;
    }
    return self;
}

- (void)dealloc {
    if (_engine) {
        _engine->destroy();
    }
}

RCT_EXPORT_METHOD(initEngine:(float)sampleRate
                  bufferSize:(int)bufferSize
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    @try {
        BOOL result = _engine->init(sampleRate, (size_t)bufferSize);
        _initialized = result;
        resolve(@(result));
    } @catch (NSException *exception) {
        reject(@"INIT_ERROR", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(destroyEngine)
{
    if (_engine) {
        _engine->destroy();
        _initialized = false;
    }
}

RCT_EXPORT_METHOD(updateParams:(NSDictionary *)params)
{
    if (!_engine) return;

    voicemod::VoiceModParams p;

    NSDictionary *voice = params[@"voice"];
    if (voice) {
        p.gainDb = [voice[@"gain"] floatValue];
        p.pitchShiftSemitones = [voice[@"pitchShift"] floatValue];
    }

    NSDictionary *eq = params[@"eq"];
    if (eq) {
        p.lowShelfDb = [eq[@"lowShelf"] floatValue];
        p.highShelfDb = [eq[@"highShelf"] floatValue];
        p.midShelfDb = [eq[@"midShelf"] floatValue];
        p.trebleDb = [eq[@"treble"] floatValue];
    }

    NSDictionary *spatial = params[@"spatial"];
    if (spatial) {
        p.spatialWidth = [spatial[@"width"] floatValue];
        p.pan = [spatial[@"pan"] floatValue];
        p.autoPanSpeed = [spatial[@"autoPanSpeed"] floatValue];
    }

    NSDictionary *space = params[@"space"];
    if (space) {
        p.reverbSize = [space[@"reverbSize"] floatValue];
        p.reverbMix = [space[@"reverbMix"] floatValue];
    }

    p.enabled = [params[@"enabled"] boolValue];

    _engine->updateParams(p);
}

RCT_EXPORT_METHOD(processBuffer:(float *)buffer
                  offset:(int)offset
                  numSamples:(int)numSamples)
{
    if (!_engine) return;
    _engine->processInterleaved(buffer + offset, buffer + offset, (size_t)numSamples);
}

RCT_EXPORT_METHOD(getLatency:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    if (!_engine) {
        resolve(@(0));
        return;
    }
    resolve(@(_engine->getLatencyMs()));
}

RCT_EXPORT_METHOD(resetEngine)
{
    if (_engine) {
        _engine->reset();
    }
}

@end
