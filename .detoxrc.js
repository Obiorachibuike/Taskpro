module.exports={
  testRunner:{args:{$0:'jest',config:'e2e/jest.config.js'},jest:{setupTimeout:180000}},
  apps:{'android.debug':{type:'android.apk',binaryPath:'android/app/build/outputs/apk/debug/app-debug.apk',build:'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug'}},
  devices:{'android.emulator':{type:'android.emulator',device:{avdName:'TaskPro_API_35'}}},
  configurations:{'android.emu.debug':{device:'android.emulator',app:'android.debug'}},
};
