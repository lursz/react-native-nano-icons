package com.reactnativenanoiconsmonorepo.nanoiconsandroid

import com.facebook.react.bridge.ReactApplicationContext

class NanoIconsAndroidModule(reactContext: ReactApplicationContext) :
  NativeNanoIconsAndroidSpec(reactContext) {

  override fun multiply(a: Double, b: Double): Double {
    return a * b
  }

  companion object {
    const val NAME = NativeNanoIconsAndroidSpec.NAME
  }
}
