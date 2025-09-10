const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");

function initialize(passport, getUserById, getUserByEmail) {
  const authenticateUser = async (email, password, done) => {
    console.log("Login attempt for email:", email);
    const user = getUserByEmail(email);
    console.log("Found user:", user ? "Yes" : "No");
    if (user) {
      console.log("User verified:", user.isVerified);
    }

    if (user == null) {
      return done(null, false, { message: "No user with that email" });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return done(null, false, {
        message: "Please verify your email before logging in",
      });
    }

    try {
      if (await bcrypt.compare(password, user.password)) {
        return done(null, user);
      } else {
        return done(null, false, { message: "Password incorrect" });
      }
    } catch (e) {
      return done(e);
    }
  };

  passport.use(new LocalStrategy({ usernameField: "email" }, authenticateUser));
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  passport.deserializeUser((id, done) => done(null, getUserById(id)));
}

module.exports = initialize;
