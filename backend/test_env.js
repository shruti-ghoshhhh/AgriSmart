require('dotenv').config();
console.log("Injected Env Count:", Object.keys(process.env).filter(k => ['PORT', 'MONGODB_URI', 'JWT_SECRET', 'GEMINI_API_KEY'].includes(k)).length);
console.log("PORT:", process.env.PORT);
console.log("MONGODB_URI:", process.env.MONGODB_URI ? "Defined" : "MISSING");
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "Defined" : "MISSING");
console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "Defined" : "MISSING");
console.log("GEMINI_API_KEY LENGTH:", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0);
