import { by,device,element,waitFor } from 'detox';
beforeAll(async()=>{
  await device.launchApp({newInstance:true,permissions:{notifications:'YES'}});
  try {
    await waitFor(element(by.id('onboarding-next'))).toBeVisible().withTimeout(5000);
    await element(by.id('onboarding-next')).tap();
    await element(by.id('onboarding-next')).tap();
    await element(by.id('onboarding-next')).tap();
  } catch { /* Returning installs skip onboarding. */ }
});
beforeEach(async()=>{await device.launchApp({newInstance:true,permissions:{notifications:'YES'}});});
