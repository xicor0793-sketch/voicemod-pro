#include "VoiceModHostModule.h"
#include <jsi/jsi.h>
#include <cstring>

namespace facebook::jsi {

using namespace facebook::jsi;

VoiceModHostModule::VoiceModHostModule()
    : engine_(std::make_unique<voicemod::VoiceModEngine>()) {}

VoiceModHostModule::~VoiceModHostModule() {
    if (engine_) engine_->destroy();
}

std::shared_ptr<VoiceModHostModule> VoiceModHostModule::create() {
    return std::make_shared<VoiceModHostModule>();
}

void VoiceModHostModule::registerModule(Runtime& runtime) {
    auto module = create();
    auto obj = Object::createFromHostObject(runtime, module);
    runtime.global().setProperty(runtime, "__VoiceModNative", obj);
}

Value VoiceModHostModule::get(Runtime& runtime, const PropNameID& name) {
    auto propName = name.utf8(runtime);

    if (propName == "initEngine") {
        return Function::createFromHostFunction(runtime,
            PropNameID::forAscii(runtime, "initEngine"), 2,
            [this](Runtime& rt, const Value&, const Value* args, size_t count) -> Value {
                return this->initEngine(rt, args, count);
            });
    }
    if (propName == "destroyEngine") {
        return Function::createFromHostFunction(runtime,
            PropNameID::forAscii(runtime, "destroyEngine"), 0,
            [this](Runtime& rt, const Value&, const Value* args, size_t count) -> Value {
                return this->destroyEngine(rt, args, count);
            });
    }
    if (propName == "updateParams") {
        return Function::createFromHostFunction(runtime,
            PropNameID::forAscii(runtime, "updateParams"), 1,
            [this](Runtime& rt, const Value&, const Value* args, size_t count) -> Value {
                return this->updateParams(rt, args, count);
            });
    }
    if (propName == "processBuffer") {
        return Function::createFromHostFunction(runtime,
            PropNameID::forAscii(runtime, "processBuffer"), 3,
            [this](Runtime& rt, const Value&, const Value* args, size_t count) -> Value {
                return this->processBuffer(rt, args, count);
            });
    }
    if (propName == "getLatency") {
        return Function::createFromHostFunction(runtime,
            PropNameID::forAscii(runtime, "getLatency"), 0,
            [this](Runtime& rt, const Value&, const Value* args, size_t count) -> Value {
                return this->getLatency(rt, args, count);
            });
    }
    if (propName == "resetEngine") {
        return Function::createFromHostFunction(runtime,
            PropNameID::forAscii(runtime, "resetEngine"), 0,
            [this](Runtime& rt, const Value&, const Value* args, size_t count) -> Value {
                return this->resetEngine(rt, args, count);
            });
    }

    return Value::undefined();
}

void VoiceModHostModule::set(Runtime& runtime, const PropNameID& name, const Value& value) {
    // Read-only module
}

std::vector<PropNameID> VoiceModHostModule::getPropertyNames(Runtime& runtime) {
    std::vector<PropNameID> names;
    names.push_back(PropNameID::forAscii(runtime, "initEngine"));
    names.push_back(PropNameID::forAscii(runtime, "destroyEngine"));
    names.push_back(PropNameID::forAscii(runtime, "updateParams"));
    names.push_back(PropNameID::forAscii(runtime, "processBuffer"));
    names.push_back(PropNameID::forAscii(runtime, "getLatency"));
    names.push_back(PropNameID::forAscii(runtime, "resetEngine"));
    return names;
}

// --- Method implementations ---

Value VoiceModHostModule::initEngine(Runtime& runtime, const Value* args, size_t count) {
    if (count < 2) return Value(false);
    double sampleRate = args[0].asNumber();
    double bufferSize = args[1].asNumber();
    bool result = engine_->init(static_cast<float>(sampleRate), static_cast<size_t>(bufferSize));
    initialized_ = result;
    return Value(result);
}

Value VoiceModHostModule::destroyEngine(Runtime& runtime, const Value* args, size_t count) {
    engine_->destroy();
    initialized_ = false;
    return Value::undefined();
}

Value VoiceModHostModule::updateParams(Runtime& runtime, const Value* args, size_t count) {
    if (count < 1 || !args[0].isObject()) return Value::undefined();
    auto obj = args[0].asObject(runtime);
    auto params = readParamsFromJS(runtime, obj);
    engine_->updateParams(params);
    return Value::undefined();
}

Value VoiceModHostModule::processBuffer(Runtime& runtime, const Value* args, size_t count) {
    if (count < 3) return Value::undefined();
    double inputPtr = args[0].asNumber();
    double outputPtr = args[1].asNumber();
    double numSamples = args[2].asNumber();

    float* input = reinterpret_cast<float*>(static_cast<uintptr_t>(inputPtr));
    float* output = reinterpret_cast<float*>(static_cast<uintptr_t>(outputPtr));

    engine_->processInterleaved(input, output, static_cast<size_t>(numSamples));
    return Value::undefined();
}

Value VoiceModHostModule::getLatency(Runtime& runtime, const Value* args, size_t count) {
    return Value(engine_->getLatencyMs());
}

Value VoiceModHostModule::resetEngine(Runtime& runtime, const Value* args, size_t count) {
    engine_->reset();
    return Value::undefined();
}

// --- Helper: Read VoiceModParams from JS object ---

voicemod::VoiceModParams VoiceModHostModule::readParamsFromJS(Runtime& runtime, const Object& obj) {
    voicemod::VoiceModParams params;

    auto readNested = [&](const std::string& key, auto& target) {
        if (obj.hasProperty(runtime, key.c_str())) {
            auto nested = obj.getProperty(runtime, key.c_str()).asObject(runtime);
            target = static_cast<decltype(target)>(nested.asNumber());
        }
    };

    auto readNestedFloat = [&](const std::string& parentKey, const std::string& childKey, float& target) {
        if (obj.hasProperty(runtime, parentKey.c_str())) {
            auto parent = obj.getProperty(runtime, parentKey.c_str()).asObject(runtime);
            if (parent.hasProperty(runtime, childKey.c_str())) {
                target = static_cast<float>(parent.getProperty(runtime, childKey.c_str()).asNumber());
            }
        }
    };

    readNestedFloat("voice", "gain", params.gainDb);
    readNestedFloat("voice", "pitchShift", params.pitchShiftSemitones);

    readNestedFloat("eq", "lowShelf", params.lowShelfDb);
    readNestedFloat("eq", "highShelf", params.highShelfDb);
    readNestedFloat("eq", "midShelf", params.midShelfDb);
    readNestedFloat("eq", "treble", params.trebleDb);

    readNestedFloat("spatial", "width", params.spatialWidth);
    readNestedFloat("spatial", "pan", params.pan);
    readNestedFloat("spatial", "autoPanSpeed", params.autoPanSpeed);

    readNestedFloat("space", "reverbSize", params.reverbSize);
    readNestedFloat("space", "reverbMix", params.reverbMix);

    if (obj.hasProperty(runtime, "enabled")) {
        params.enabled = obj.getProperty(runtime, "enabled").getBool();
    }

    return params;
}

Object VoiceModHostModule::paramsToJS(Runtime& runtime, const voicemod::VoiceModParams& params) {
    auto obj = Object(runtime);

    auto voice = Object(runtime);
    voice.setProperty(runtime, "gain", params.gainDb);
    voice.setProperty(runtime, "pitchShift", params.pitchShiftSemitones);
    obj.setProperty(runtime, "voice", voice);

    auto eq = Object(runtime);
    eq.setProperty(runtime, "lowShelf", params.lowShelfDb);
    eq.setProperty(runtime, "highShelf", params.highShelfDb);
    eq.setProperty(runtime, "midShelf", params.midShelfDb);
    eq.setProperty(runtime, "treble", params.trebleDb);
    obj.setProperty(runtime, "eq", eq);

    auto spatial = Object(runtime);
    spatial.setProperty(runtime, "width", params.spatialWidth);
    spatial.setProperty(runtime, "pan", params.pan);
    spatial.setProperty(runtime, "autoPanSpeed", params.autoPanSpeed);
    obj.setProperty(runtime, "spatial", spatial);

    auto space = Object(runtime);
    space.setProperty(runtime, "reverbSize", params.reverbSize);
    space.setProperty(runtime, "reverbMix", params.reverbMix);
    obj.setProperty(runtime, "space", space);

    obj.setProperty(runtime, "enabled", params.enabled);

    return obj;
}

} // namespace facebook::jsi
