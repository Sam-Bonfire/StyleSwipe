# Pin to Bun 1.2.0 to avoid fsevents infinite loop bug in 1.3.x
FROM oven/bun:1.2.0

# Install Git and other dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    unzip \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Install Jujutsu (jj)
# Using linux-musl (static) as it's the standard Linux binary from jj-vcs
RUN wget -q https://github.com/jj-vcs/jj/releases/download/v0.37.0/jj-v0.37.0-x86_64-unknown-linux-musl.tar.gz -O jj.tar.gz \
    && tar -xzf jj.tar.gz -C /usr/local/bin \
    && rm jj.tar.gz \
    && chmod +x /usr/local/bin/jj

# Install global tools
RUN bun add -g @go-task/cli
