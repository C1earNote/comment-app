# Use official Node.js LTS Alpine image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the NestJS app
RUN npm run build

# Expose the port NestJS runs on
EXPOSE 3000

# Run the app
CMD ["node", "dist/main.js"]
