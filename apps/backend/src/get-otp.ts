import { Redis } from "ioredis";

const run = async () => {
  const redis = new Redis("redis://localhost:6379");
  const email = "tanishq.s.2021.cse@ritchennai.edu.in";
  const key = `otp:${email}`;

  console.log(`🔍 Checking Redis for key: ${key}`);
  const code = await redis.get(key);

  if (code) {
    console.log(`✅ FOUND OTP CODE: ${code}`);
  } else {
    console.log("❌ No OTP found in Redis. It might have expired (300s TTL).");
  }

  redis.disconnect();
};

run();
