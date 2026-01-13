FROM node:20-bullseye-slim
WORKDIR /app

# Install deps
COPY package.json package-lock.json* ./
RUN npm ci --silent || npm install --silent

# Copy source
COPY . .

EXPOSE 5173

ENV HOST 0.0.0.0
ENV PORT 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
