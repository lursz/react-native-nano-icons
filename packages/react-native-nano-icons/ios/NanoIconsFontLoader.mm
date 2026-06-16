#import "NanoIconsFontLoader.h"
#import <CoreText/CoreText.h>

@implementation NanoIconsFontLoader

RCT_EXPORT_MODULE()

/**
 * Registers a dynamically-linked (OTA) font at runtime so the NanoIconView can
 * resolve it by family name via CTFontCreateWithName.
 *
 * Reads the bytes at `uri` (file:// / http(s):// / plain path) and registers them
 * with the process font manager. Caching/versioning of remote fonts is out of scope.
 */
RCT_EXPORT_METHOD(registerFont:(NSString *)family
                  uri:(NSString *)uri
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  NSURL *url = [uri hasPrefix:@"/"] ? [NSURL fileURLWithPath:uri]
                                    : [NSURL URLWithString:uri];
  if (!url) {
    reject(@"E_NANOICONS_FONT_REGISTER",
           [NSString stringWithFormat:@"Invalid font uri: %@", uri], nil);
    return;
  }

  NSData *data = [NSData dataWithContentsOfURL:url];
  if (!data) {
    reject(@"E_NANOICONS_FONT_REGISTER",
           [NSString stringWithFormat:@"Could not read font at %@", uri], nil);
    return;
  }

  CGDataProviderRef provider = CGDataProviderCreateWithCFData((__bridge CFDataRef)data);
  CGFontRef cgFont = CGFontCreateWithDataProvider(provider);
  CGDataProviderRelease(provider);
  if (!cgFont) {
    reject(@"E_NANOICONS_FONT_REGISTER", @"Invalid font data", nil);
    return;
  }

  CFErrorRef error = NULL;
  bool ok = CTFontManagerRegisterGraphicsFont(cgFont, &error);
  CGFontRelease(cgFont);

  if (!ok && error) {
    NSError *err = (__bridge_transfer NSError *)error;
    // Re-registering the same font is not a failure for our purposes.
    if (err.code == kCTFontManagerErrorAlreadyRegistered) {
      resolve(@(YES));
      return;
    }
    reject(@"E_NANOICONS_FONT_REGISTER", err.localizedDescription, err);
    return;
  }

  resolve(@(YES));
}

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeNanoIconsFontLoaderSpecJSI>(params);
}
#endif

@end
