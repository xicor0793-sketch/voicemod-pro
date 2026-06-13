#pragma once

#include <jsi/jsi.h>
#include <memory>
#include <string>

#include "../cpp/VoiceModEngine.h"

namespace facebook::jsi {

class VoiceModHostModule : public facebook::jsi::HostObject {
public:
    VoiceModHostModule();
    virtual ~VoiceModHostModule();

    static std::shared_ptr<VoiceModHostModule> create();
    static void registerModule(Runtime& runtime);

    // HostObject interface
    facebook::jsi::Value get(Runtime& runtime, const PropNameID& name) override;
    void set(Runtime& runtime, const PropNameID& name, const facebook::jsi::Value& value) override;
    std::vector<PropNameID> getPropertyNames(Runtime& runtime) override;

private:
    std::unique_ptr<voicemod::VoiceModEngine> engine_;
    bool initialized_ = false;

    // JS-callable methods
    facebook::jsi::Value initEngine(Runtime& runtime, const facebook::jsi::Value* args, size_t count);
    facebook::jsi::Value destroyEngine(Runtime& runtime, const facebook::jsi::Value* args, size_t count);
    facebook::jsi::Value updateParams(Runtime& runtime, const facebook::jsi::Value* args, size_t count);
    facebook::jsi::Value processBuffer(Runtime& runtime, const facebook::jsi::Value* args, size_t count);
    facebook::jsi::Value getLatency(Runtime& runtime, const facebook::jsi::Value* args, size_t count);
    facebook::jsi::Value resetEngine(Runtime& runtime, const facebook::jsi::Value* args, size_t count);

    // Helper: read VoiceModParams from a JS object
    voicemod::VoiceModParams readParamsFromJS(Runtime& runtime, const facebook::jsi::Object& obj);

    // Helper: create a JS object from VoiceModParams
    facebook::jsi::Object paramsToJS(Runtime& runtime, const voicemod::VoiceModParams& params);
};

} // namespace facebook::jsi
