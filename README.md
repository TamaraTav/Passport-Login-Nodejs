# Passport Authentication Node.js Application

A comprehensive Node.js authentication application built with Express.js and Passport.js, featuring user registration, login, email verification, and password reset functionality.

## Features

- **User Authentication**: Secure registration and login system
- **Email Verification**: Email-based account verification
- **Password Reset**: Forgot password and reset functionality
- **Session Management**: Secure session handling with express-session
- **Rate Limiting**: Protection against brute force attacks
- **Security Headers**: Helmet.js for security headers
- **API Documentation**: Swagger/OpenAPI documentation
- **Comprehensive Testing**: Unit and integration tests with Jest
- **Error Handling**: Centralized error handling middleware
- **Validation**: Input validation and sanitization

## Tech Stack

- **Backend**: Node.js, Express.js
- **Authentication**: Passport.js with Local Strategy
- **Templating**: EJS
- **Email**: Nodemailer with Gmail SMTP
- **Security**: Helmet.js, express-rate-limit, express-flash
- **Testing**: Jest, Supertest
- **Documentation**: Swagger UI, swagger-jsdoc
- **Linting**: ESLint

## Project Structure

```
├── config/
│   └── swagger.js          # Swagger configuration
├── controllers/
│   ├── authController.js   # Authentication logic
│   └── passwordController.js # Password reset logic
├── middleware/
│   ├── errorHandler.js     # Error handling middleware
│   ├── security.js         # Security and rate limiting
│   └── validation.js       # Input validation
├── models/
│   ├── User.js            # User data model
│   └── Token.js           # Token management model
├── routes/
│   ├── authRoutes.js      # Authentication routes
│   └── passwordRoutes.js  # Password reset routes
├── services/
│   └── emailService.js    # Email service
├── tests/
│   ├── integration/       # Integration tests
│   ├── models/           # Model tests
│   └── utils/            # Utility tests
├── utils/
│   ├── errors.js         # Custom error classes
│   └── tokenUtils.js     # Token utilities
├── views/                # EJS templates
├── server.js             # Main application file
└── passport-config.js    # Passport configuration
```

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd Passport-Login-Nodejs
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:

   ```env
   NODE_ENV=development
   SESSION_SECRET=your-super-secret-session-key
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   BASE_URL=http://localhost:3002
   ```

4. **Gmail Setup**
   - Enable 2-factor authentication on your Gmail account
   - Generate an App Password for this application
   - Use the App Password in `EMAIL_PASS` environment variable

## Usage

1. **Start the application**

   ```bash
   npm start
   ```

2. **Access the application**

   - Main application: http://localhost:3002
   - API Documentation: http://localhost:3002/api-docs

3. **Available Routes**
   - `GET /` - Home page (requires authentication)
   - `GET /login` - Login page
   - `POST /login` - Login user
   - `GET /register` - Registration page
   - `POST /register` - Register new user
   - `DELETE /logout` - Logout user
   - `GET /verify-email` - Email verification
   - `GET /forgot-password` - Forgot password page
   - `POST /forgot-password` - Submit forgot password
   - `GET /reset-password` - Reset password page
   - `POST /reset-password` - Submit new password

## Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test files
npm test -- tests/models/User.test.js
```

## API Documentation

The application includes comprehensive API documentation powered by Swagger UI. Access it at:

- **Swagger UI**: http://localhost:3002/api-docs

The documentation includes:

- All available endpoints
- Request/response schemas
- Authentication requirements
- Error responses
- Interactive testing interface

## Security Features

- **Rate Limiting**: Prevents brute force attacks
- **Security Headers**: Helmet.js for security headers
- **Session Security**: Secure session configuration
- **Input Validation**: Comprehensive input validation
- **Password Hashing**: bcrypt for password security
- **CSRF Protection**: Built-in CSRF protection
- **XSS Protection**: Input sanitization

## Development

1. **Code Quality**

   ```bash
   # Run linter
   npm run lint

   # Fix linting issues
   npm run lint:fix
   ```

2. **File Structure**
   - Controllers handle business logic
   - Models manage data operations
   - Routes define API endpoints
   - Middleware handles cross-cutting concerns
   - Services manage external integrations

## Environment Variables

| Variable         | Description          | Default                 |
| ---------------- | -------------------- | ----------------------- |
| `NODE_ENV`       | Environment mode     | `development`           |
| `SESSION_SECRET` | Session secret key   | Required                |
| `EMAIL_USER`     | Gmail username       | Required                |
| `EMAIL_PASS`     | Gmail app password   | Required                |
| `BASE_URL`       | Application base URL | `http://localhost:3002` |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue in the repository.
