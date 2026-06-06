import Zernio from '@zernio/node';
import dotenv from 'dotenv';
dotenv.config();

const zernio = new Zernio({
  apiKey: process.env.ZERNIO_API_KEY
});

async function run() {
  const profileId = "6a21ae746ba20b4f035de3f8";
  const redirectUrl = "http://localhost:5000/api/social/callback?profileId=" + profileId;

  // Let's test different parameter formats for connect.getConnectUrl
  // Format 1: { platform, profileId, redirectUrl }
  try {
    console.log("--- Format 1: profileId ---");
    const res = await zernio.connect.getConnectUrl({
      platform: 'linkedin',
      profileId,
      redirectUrl
    });
    console.log("Format 1 Success:", res);
  } catch (error) {
    console.error("Format 1 Error:", error.message, error);
  }

  // Format 2: { platform, profile, redirectUrl }
  try {
    console.log("--- Format 2: profile ---");
    const res = await zernio.connect.getConnectUrl({
      platform: 'linkedin',
      profile: profileId,
      redirectUrl
    });
    console.log("Format 2 Success:", res);
  } catch (error) {
    console.error("Format 2 Error:", error.message, error);
  }

  // Format 3: { platform, redirectUrl } with profileId in options/headers
  try {
    console.log("--- Format 3: profileId in second arg options ---");
    const res = await zernio.connect.getConnectUrl({
      platform: 'linkedin',
      redirectUrl
    }, {
      profileId: profileId
    });
    console.log("Format 3 Success:", res);
  } catch (error) {
    console.error("Format 3 Error:", error.message, error);
  }
}

run();
