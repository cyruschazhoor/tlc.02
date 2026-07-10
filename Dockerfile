# Step 1: Choose the starting environment (Node.js example)
FROM node:18-alpine

# Step 2: Create a folder inside the container for your app
WORKDIR /app

# Step 3: Copy your project files into that folder
COPY package*.json ./
RUN npm install
COPY . .

# Step 4: Open a door for people to visit your app
EXPOSE 3000

# Step 5: The final command to turn your app on
CMD ["npm", "run", "dev"]
