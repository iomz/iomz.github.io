---
title:  "Does Stable Diffusion run on NVIDIA Jetson AGX Xavier Developer Kit with CUDA?"
categories:
  - How-to
tags:
  - Deep Learning
  - NVIDIA
  - CUDA
  - Docker
  - Python
---

A [Jetson AGX Xavier developer kit](https://www.nvidia.com/de-de/autonomous-machines/embedded-systems/jetson-agx-xavier/) has been lying around in the lab for a while without being used by anyone.
I picked it up for my Sunday project to test [Stable Diffusion](https://stability.ai/) with the CUDA cores to study the state-of-the-art "AI" image generation technique -- [the original paper](https://arxiv.org/abs/2112.10752) from the CompVis group is a great read.

The board I tested today is the very first model of AGX Xavier (P2822-0000) with 16G memory.

**Disclaimer: I'm not at all an expert in deep learning or text-to-image.**

# TL;DR

See the [Diffusers on Docker](#diffusers-on-docker) section to run the txt2img container on Xavier with JetPack 5.0.2.
If your Xavier doesn't have the version of JetPack, keep reading.

# Prepare the Jetson AGX Xavier

The NVIDIA Jetson series require [NVIDIA JetPack](https://developer.nvidia.com/embedded/jetpack), which provides "a full development environment for hardware-accelerated AI-at-the-edge development" including the Jetson Linux image (Linux4Tegra, L4T), CUDA setup, etc.

To start with, you need a NVIDIA developer account.
Sign up from [https://developer.nvidia.com/](https://developer.nvidia.com/).

You can just follow the official well-documented instruction [here](https://docs.nvidia.com/jetson/jetpack/install-jetpack/index.html), but I'm taking note for the precise steps I've taken below FYI.

## Install NVIDIA JetPack

I first installed the latest JetPack (5.0.2 at the time of writing), which comes with L4T 35.1.0 and CUDA 11.4.239.
To flash the L4T image to Xavier, I used [NVIDIA SDK Manager](https://developer.nvidia.com/drive/sdk-manager) from my Ubuntu laptop and a USB Type C cable.

### Install SDK Manager

Download the `.deb` file for the SDK manager from [https://developer.nvidia.com/drive/sdk-manager](https://developer.nvidia.com/drive/sdk-manager) and install it on the host Ubuntu machine (not on Xavier)

```sh
sudo apt install sdkmanager_1.9.0-10816_amd64.deb
```

### Start SDK Manager

Run the SDK manager and login with your NVIDIA developer account (on the Ubuntu machine)

```sh
sdkmanager
```

### Power on Xavier in recovery mode

[Press force recovery button and power button on AGX Xavier to enter recovery mode](https://wiki.hanzheteng.com/equipment-and-devices/nvidia-agx-xavier).
Connect the USB Type C cable to the Type C port of Xavier. The SDK Manager should detect the Xavier.

![Port](https://interactions.ics.unisg.ch/~iomz/assets/img/201482921-4900383f-da0d-4877-a126-819862a1567d.jpg)

![SDK Manager](https://interactions.ics.unisg.ch/~iomz/assets/img/201481564-398f294b-8685-4283-ad7e-88e410f6a625.png)

### Flash the L4T image

Follow the wizard to flash the image

![Flashing](https://interactions.ics.unisg.ch/~iomz/assets/img/201482955-53d0bdb4-3de6-479a-bcb0-6ebbcaaa0d8e.png)

### Finish "System configuration wizard"

Once the Linux image is flashed, then this window will pop up. Continue setting up the Xavier as it is telling us – you need a keyboard (+ a mouse) and a display to do so.

![Before SDK](https://interactions.ics.unisg.ch/~iomz/assets/img/201483107-74c42e05-470e-49af-8596-4d2eacf1e59a.png)

### Reboot

In the end of this "System configuration wizard", Xavier tries to reboot but it seems it hangs at

```console
A start job is running for End-user configuration after initial OEM installation
```

Just tap the power/reset button to force-reboot.
![power button](https://interactions.ics.unisg.ch/~iomz/assets/img/201483705-1205e60c-0537-4d7e-a6b1-1bbc9d8518fd.jpg)

### Install the SDK

By default, xavier has the bridge interface `l4tbr0` with the v4 address `192.168.55.1` setup for the SDK manager to connect to and install the SDK components. I.e., you don't need to change the address. Just enter your user credential in the wizard just like above and hit the `Install` button.

![l4tbr0](https://interactions.ics.unisg.ch/~iomz/assets/img/201483151-ee2c57e2-4944-4fa5-9246-c712e2f50572.png)

When finished, Xavier is all set with the JetPack now 😁

```console
% /usr/local/cuda/bin/nvcc --version
nvcc: NVIDIA (R) Cuda compiler driver
Copyright (c) 2005-2022 NVIDIA Corporation
Built on Wed_May__4_00:02:26_PDT_2022
Cuda compilation tools, release 11.4, V11.4.239
Build cuda_11.4.r11.4/compiler.31294910_0
```

## jetsonUtilities

I also found [jetsonhacks/jetsonUtilities](https://github.com/jetsonhacks/jetsonUtilities) to be useful to check the JetPack installation.

```console
% python jetsonInfo.py
NVIDIA Jetson-AGX
 L4T 35.1.0 [ JetPack 5.0.2 ]
   Ubuntu 20.04.5 LTS
   Kernel Version: 5.10.104-tegra
 CUDA 11.4.239
   CUDA Architecture: NONE
 OpenCV version: 4.5.4
   OpenCV Cuda: NO
 CUDNN: 8.4.1.50
 TensorRT: 8.4.1.5
 Vision Works: NOT_INSTALLED
 VPI: 2.1.6
 Vulcan: 1.3.203
```

## Jetson stats

Also, [Jetson stats](https://github.com/rbonghi/jetson_stats) is a useful tool with a beautiful interface.

```sh
sudo -H pip install -U jetson-stats
jtop
```

![jtop](https://interactions.ics.unisg.ch/~iomz/assets/img/201536509-4f8f9205-670d-4e0b-8694-6154b8aad9b2.gif)

## Tune Xavier

There are some tips to exploit the maximum performance on the Jetson device.

Update the fun profile in `/etc/nvfancontrol.conf`

```js
FAN_DEFAULT_PROFILE cool
```

Restart the service

```sh
sudo systemctl restart nvfancontrol
```

Nvidia Power Model Tool to config ID=0 "MAXN" (the NONE power model to release all constraints)

```sh
sudo nvpmodel -m 0
```

Set static max frequency to CPU, GPU and EMC clocks

```sh
sudo jetson_clocks
```

## Mount a disk

The disk space on the eMMC is so limited that there's only 4GB available (!) after the installation.

```console
% sudo df -h /dev/mmcblk0p1
Filesystem      Size  Used Avail Use% Mounted on
/dev/mmcblk0p1   28G   23G  4.0G  85% /
```

For the [NVIDIA L4T PyTorch](https://catalog.ngc.nvidia.com/orgs/nvidia/containers/l4t-pytorch) container, it is too little for the image to be downloaded locally.
I thought of using the NFS share for the Docker data root, but since OverlayFS is not supported on NFS (["The upper filesystem will normally be writable and if it is it must support the creation of trusted. so NFS is not suitable."](https://www.kernel.org/doc/Documentation/filesystems/overlayfs.txt)), I decided to mount an SD card (`/dev/mmcblk1`) as an ext4 filesystem.

```sh
sudo dd if=/dev/zero of=/dev/mmcblk1 bs=4096 status=progress
sudo parted /dev/mmcblk1 --script -- mklabel gpt
sudo parted /dev/mmcblk1 --script -- mkpart primary ext4 0% 100%
sudo mkfs.ext4 /dev/mmcblk1p1 -L XAVIER_SD
```

This formats the SD card

```console
% sudo parted /dev/mmcblk1 --script print
Model: SD SD32G (sd/mmc)
Disk /dev/mmcblk1: 31.9GB
Sector size (logical/physical): 512B/512B
Partition Table: gpt
Disk Flags:

Number  Start   End     Size    File system  Name     Flags
 1      1049kB  31.9GB  31.9GB  ext4         primary
```

Mount the SD card to `/mnt/sd`

```sh
sudo mkdir -p /mnt/sd
echo "LABEL=XAVIER_SD /mnt/sd  ext4  defaults  0 0" | sudo tee -a /etc/fstab
sudo mount -a
```

Copy `/home` to `/mnt/sd/home` and link (do this with caution)

```sh
sudo rsync -avxP /home /mnt/sd/
rm -fr /home && ln -sfnv /mnt/sd/home /home
```

Stop the docker daemon

```sh
sudo systemctl stop docker
```

Migrate `/var/lib/docker` to `/mnt/sd/docker`

```sh
sudo rsync -avxP /var/lib/docker /mnt/sd/
```

Edit `/etc/docker/daemon.json`

```js
{
    "data-root": "/mnt/sd/docker",
    "runtimes": {
        "nvidia": {
            "path": "nvidia-container-runtime",
            "runtimeArgs": []
        }
    }
}
```

Restart the docker daemon

```sh
sudo systemctl start docker
```

# Diffusers on Docker

The easiest way to try the Stable Diffusion models would be using [Diffusers](https://github.com/huggingface/diffusers) from [Hugging Face](https://huggingface.co).

After many trials and errors (see [the later section](#things-i-tried-but-didnt-work) of this post), I created a Docker image with which I can try a text-to-image app based on the Stable Diffusion models with Diffusers: [iomz/diffusers-jetson](https://hub.docker.com/repository/docker/iomz/diffusers-jetson).
Also see [https://github.com/iomz/docker-diffusers-jetson](https://github.com/iomz/docker-diffusers-jetson) – I didn't automate the Docker image build as it is specific to the Xavier with a certain JetPack.

The image is [built from nvcr.io/nvidia/l4t-pytorch:r35.1.0-pth1.11-py3](https://github.com/iomz/docker-diffusers-jetson/blob/941eb365ac4294b51706546e496deb2dbe48e053/Dockerfile#L1) since this build supports `torch.distributed` required for Diffusers.

Here's all you need to do.

## Clone the repo

```sh
git clone https://github.com/iomz/docker-diffusers-jetson
```

## Clone a model from Huging Face in `models/` with git lfs

First install git lfs
```sh
curl -s https://packagecloud.io/install/repositories/github/git-lfs/script.deb.sh | sudo bash
sudo apt install git-lfs
```

Then clone the model, e.g., runwayml/stable-diffusion-v1-5 (it should take a while)

```sh
mkdir -p docker-diffusers-jetson/models && cd $_
git clone https://huggingface.co/runwayml/stable-diffusion-v1-5
```

## Run txt2img via Docker Compose

```console
% docker-compose run --rm txt2img -h
Creating docker-diffusers-jetson_txt2img_run ... done
usage: txt2img.py [-h] [--model MODEL] [--device DEVICE] [--nis NIS] [--out OUT] prompt

A simple text-to-image app with diffusers.StableDiffusionPipeline

positional arguments:
  prompt           a text string to be passed as the prompt

optional arguments:
  -h, --help       show this help message and exit
  --model MODEL    path to the model (default: ./models/stable-diffusion-v1-5)
  --device DEVICE  device (default: cuda)
  --nis NIS        value for num_inference_steps (default: 51)
  --out OUT        result image file (default: out.png)
```

```sh
docker-compose run --rm txt2img "abandoned building in forest with beautiful glass windows"
```

![stable-diffusion-v1-5](https://interactions.ics.unisg.ch/~iomz/assets/img/201538507-22b48b01-204c-4d82-8b40-1cea9d0b98e1.png)

You can use a different model (e.g., [prompthero/midjourney-v4-diffusion](https://huggingface.co/prompthero/midjourney-v4-diffusion)) with `--model` option (default: `models/stable-diffusion-v1-5`)

```sh
docker-compose run --rm txt2img --model models/midjourney-v4-diffusion "abandoned building in forest with beautiful glass windows"
```

![midjourney-v4-diffusion](https://interactions.ics.unisg.ch/~iomz/assets/img/201538433-1015771d-f537-481f-8f72-f7667e7df040.png)


# Things I tried but didn't work

This section contains my note about my failed attempts, but they should work for different purposes.

## Docker image for Stable Diffusion

[@chitoku](https://github.com/chitoku) has posted [a great note](https://forums.developer.nvidia.com/t/stable-diffusion-on-jetson-agx-orin-and-xavier/229800) in the NVIDIA developer forum.
However, it seems that my Xavier has too few VRAM for this approach (not sure, but it gets killed even before the first iteration of the inference).

## PyTorch on Xavier

Building PyTorch on AArch64 machines is [a bit of hassle](https://forums.developer.nvidia.com/t/pytorch-for-jetson/72048) – I tried [this](https://github.com/pytorch/pytorch#from-source) but failed a few times on the Xavier with an older version of JetPack.
Thankfully, NVIDIA also saves us from the effort by providing a pre-built wheel in the [Jetson Download Center](https://developer.nvidia.com/embedded/downloads).
Look for "PyTorch for JetPack (JP 5.0.2)". There's also a nice doc for [Installing PyTorch for Jetson Platform](https://docs.nvidia.com/deeplearning/frameworks/install-pytorch-jetson-platform/index.html).

1. Install the prerequisites

```sh
sudo apt-get -y install autoconf bc build-essential g++-8 gcc-8 clang-8 lld-8 gettext-base gfortran-8 iputils-ping libbz2-dev libc++-dev libcgal-dev libffi-dev libfreetype6-dev libhdf5-dev libjpeg-dev liblzma-dev libncurses5-dev libncursesw5-dev libpng-dev libreadline-dev libssl-dev libsqlite3-dev libxml2-dev libxslt-dev locales moreutils openssl python-openssl rsync scons python3-pip libopenblas-dev
```

2. Download the wheel

Find `torch-1.13.0a0+d0d6b1f2.nv22.10-cp38-cp38-linux_aarch64.whl`.

![PyTorch for JetPack](https://interactions.ics.unisg.ch/~iomz/assets/img/201539939-9f8b14fc-6912-4615-a75f-5787d1912f85.png)

3. Ensure Python3

Becuase of the limited disk space on the eMMC, I used [pyenv](https://github.com/pyenv/pyenv) to install `anaconda3-2022.05` for the PyTorch environment.

```console
% which python3

/home/iomz/.pyenv/shims/python3
% python3 --version
Python 3.8.13
```

4. Install PyTorch

```sh
export TORCH_INSTALL=~/torch-1.13.0a0+d0d6b1f2.nv22.10-cp38-cp38-linux_aarch64.whl
python3 -m pip install --upgrade pip; python3 -m pip install aiohttp numpy=='1.19.4' scipy=='1.5.3'; export "LD_LIBRARY_PATH=/usr/lib/llvm-8/lib:$LD_LIBRARY_PATH"; python3 -m pip install --upgrade protobuf; python3 -m pip install --no-cache $TORCH_INSTALL
```

5. Verify the installation

```python
% python
Python 3.8.13 (default, Mar 28 2022, 10:59:05)
[GCC 10.2.0] :: Anaconda, Inc. on linux
Type "help", "copyright", "credits" or "license" for more information.
>>> import torch
>>> print(torch.__version__)
1.13.0a0+d0d6b1f2.nv22.10
```

So far, ok...

## Diffusers on Xavier

I just followed [the doc](https://github.com/huggingface/diffusers#stable-diffusion-is-fully-compatible-with-diffusers).

Install the packages

```sh
pip install --upgrade diffusers[torch] transformers scipy
```

But I encounterd an error when doing `from diffusers import StableDiffusionPipeline`

```python
>>> from diffusers import StableDiffusionPipeline

Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
  File "/home/iomz/.pyenv/versions/anaconda3-2022.05/lib/python3.8/site-packages/diffusers/__init__.py", line 20, in <module>
    from .modeling_utils import ModelMixin
  File "/home/iomz/.pyenv/versions/anaconda3-2022.05/lib/python3.8/site-packages/diffusers/modeling_utils.py", line 50, in <module>
    import accelerate
  File "/home/iomz/.pyenv/versions/anaconda3-2022.05/lib/python3.8/site-packages/accelerate/__init__.py", line 7, in <module>
    from .accelerator import Accelerator
  File "/home/iomz/.pyenv/versions/anaconda3-2022.05/lib/python3.8/site-packages/accelerate/accelerator.py", line 27, in <module>
    from .checkpointing import load_accelerator_state, load_custom_state, save_accelerator_state, save_custom_state
  File "/home/iomz/.pyenv/versions/anaconda3-2022.05/lib/python3.8/site-packages/accelerate/checkpointing.py", line 24, in <module>
    from .utils import (
  File "/home/iomz/.pyenv/versions/anaconda3-2022.05/lib/python3.8/site-packages/accelerate/utils/__init__.py", line 66, in <module>
    from .operations import (
  File "/home/iomz/.pyenv/versions/anaconda3-2022.05/lib/python3.8/site-packages/accelerate/utils/operations.py", line 24, in <module>
    from torch.distributed import ReduceOp
ImportError: cannot import name 'ReduceOp' from 'torch.distributed' (/home/iomz/.pyenv/versions/anaconda3-2022.05/lib/python3.8/site-packages/torch/distributed/__init__.py)
```

PyTorch from the NVIDIA wheel doesn't have `ReduceOp` in `torch.distributed`? Let's see

```python
>>> print(torch.distributed.is_available())
False
```

Ha. I also didn't know what this `torch.distributed` is for.
Apparently, PyTorch has many cool stuff: [https://pytorch.org/docs/stable/distributed.html](https://pytorch.org/docs/stable/distributed.html).

Finally, I found that `nvcr.io/nvidia/l4t-pytorch:r34.1.1-pth1.11-py3` supports `torch.distributed` in [this post](https://forums.developer.nvidia.com/t/torch-distributed-not-supported-on-orin/220732/2?u=iori.mizutani).
Then I came up with [Diffusers on Docker](#diffusers-on-docker).
