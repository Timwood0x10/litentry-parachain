# Copyright 2021 Integritee AG
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#           http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# This is a multi-stage docker file, where the first stage is used
# for building and the second deploys the built application.

### Builder Stage
##################################################
FROM integritee/integritee-dev:0.1.10 AS builder
LABEL maintainer="zoltan@integritee.network"

# set environment variables
ENV SGX_SDK /opt/sgxsdk
ENV PATH "$PATH:${SGX_SDK}/bin:${SGX_SDK}/bin/x64:/root/.cargo/bin"
ENV PKG_CONFIG_PATH "${PKG_CONFIG_PATH}:${SGX_SDK}/pkgconfig"
ENV LD_LIBRARY_PATH "${LD_LIBRARY_PATH}:${SGX_SDK}/sdk_libs"
ENV CARGO_NET_GIT_FETCH_WITH_CLI true
ENV SGX_MODE SW

ENV HOME=/root/work

ARG WORKER_MODE_ARG
ENV WORKER_MODE=$WORKER_MODE_ARG

ARG ADDITIONAL_FEATURES_ARG
ENV ADDITIONAL_FEATURES=$ADDITIONAL_FEATURES_ARG

WORKDIR $HOME/tee-worker
COPY . $HOME

RUN make

RUN cargo test --release


### Cached Builder Stage (WIP)
##################################################
# A builder stage that uses sccache to speed up local builds with docker
# Installation and setup of sccache should be moved to the integritee-dev image, so we don't
# always need to compile and install sccache on CI (where we have no caching so far).
FROM integritee/integritee-dev:0.1.10 AS cached-builder
LABEL maintainer="zoltan@integritee.network"

# set environment variables
ENV SGX_SDK /opt/sgxsdk
ENV PATH "$PATH:${SGX_SDK}/bin:${SGX_SDK}/bin/x64:/root/.cargo/bin"
ENV PKG_CONFIG_PATH "${PKG_CONFIG_PATH}:${SGX_SDK}/pkgconfig"
ENV LD_LIBRARY_PATH "${LD_LIBRARY_PATH}:${SGX_SDK}/sdk_libs"
ENV CARGO_NET_GIT_FETCH_WITH_CLI true
ENV SGX_MODE SW

ENV HOME=/root/work

RUN rustup default stable && cargo install sccache --root /usr/local/cargo
ENV PATH "$PATH:/usr/local/cargo/bin"
ENV SCCACHE_CACHE_SIZE="3G"
ENV SCCACHE_DIR=$HOME/.cache/sccache
ENV RUSTC_WRAPPER="/usr/local/cargo/bin/sccache"

ARG WORKER_MODE_ARG
ENV WORKER_MODE=$WORKER_MODE_ARG

WORKDIR $HOME/tee-worker
COPY . $HOME

RUN --mount=type=cache,id=cargo,target=/root/work/.cache/sccache make && sccache --show-stats

RUN --mount=type=cache,id=cargo,target=/root/work/.cache/sccache cargo test --release && sccache --show-stats


### Base Runner Stage
##################################################
FROM ubuntu:20.04 AS runner

RUN apt update && apt install -y libssl-dev iproute2

COPY --from=powerman/dockerize /usr/local/bin/dockerize /usr/local/bin/dockerize


### Deployed CLI client
##################################################
FROM runner AS deployed-client
LABEL maintainer="zoltan@integritee.network"

ARG SCRIPT_DIR=/usr/local/worker-cli
ARG LOG_DIR=/usr/local/log

ENV SCRIPT_DIR ${SCRIPT_DIR}
ENV LOG_DIR ${LOG_DIR}

COPY --from=builder /root/work/tee-worker/bin/integritee-cli /usr/local/bin
COPY ./tee-worker/cli/*.sh /usr/local/worker-cli/

RUN chmod +x /usr/local/bin/integritee-cli ${SCRIPT_DIR}/*.sh
RUN mkdir ${LOG_DIR}

RUN ldd /usr/local/bin/integritee-cli && \
	/usr/local/bin/integritee-cli --version

## ts-tests
RUN apt-get install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash
RUN apt-get install -y nodejs
RUN npm install -g yarn

ENTRYPOINT ["/usr/local/bin/integritee-cli"]


### Deployed worker service
##################################################
FROM runner AS deployed-worker
LABEL maintainer="zoltan@integritee.network"

ENV SGX_SDK /opt/sgxsdk
ENV LD_LIBRARY_PATH "${LD_LIBRARY_PATH}:${SGX_SDK}/lib64"

WORKDIR /usr/local/bin

COPY --from=builder /opt/sgxsdk/lib64 /opt/sgxsdk/lib64
COPY --from=builder /root/work/tee-worker/bin/* ./
COPY --from=builder /root/work/tee-worker/local-setup/worker-config-*.json ./
COPY --from=builder /lib/x86_64-linux-gnu /lib/x86_64-linux-gnu

RUN touch spid.txt key.txt
RUN chmod +x /usr/local/bin/integritee-service
RUN ls -al /usr/local/bin

# checks
RUN ldd /usr/local/bin/integritee-service && \
	/usr/local/bin/integritee-service --version

ENTRYPOINT ["/usr/local/bin/integritee-service"]
