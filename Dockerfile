# Use Node.js Alpine image
FROM node:24-alpine

# Install SQLite and other build tools
RUN apk add --no-cache sqlite sqlite-dev

# Set working directory
WORKDIR /app

# Copy package files (if they exist)
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy project files
COPY . .

# Expose port for development (adjust as needed)
EXPOSE 3000

# Start a shell session for development
CMD ["sh"]
