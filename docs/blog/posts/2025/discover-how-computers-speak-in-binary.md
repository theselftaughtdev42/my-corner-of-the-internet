---
draft: false
authors:
  - tim
date:
  created: 2025-01-21
categories:
  - Computer Science Fundamentals
tags:
  - computer-science
  - fundamentals
description: Unravel how computers transform binary code into data, and learn to decode your internet speed.
title: Discover How Computers Speak in Binary
series: computer-science-intro
---

Ever wondered how your computer speaks its own language? This article guides you through the basics of bits and bytes, uncovering the mechanisms computers use to store and convey data. We'll see how combinations of bits can represent anything from a single number to a video file and I'll even show you how to understand your internet speed!

<!-- more -->

## Bits and Bytes
### The Smallest Bit
A 'bit' is the smallest unit of data that a computer can store. It represents a binary state. The easiest way to understand this is that a bit can be either a `1` or a `0`.

But a single bit on its own can only represent two data points: `1` or `0`. In order for a computer to make use of data, it needs more capacity. The more bits we combine together, the more unique values we can use and therefore the greater our capacity to represent data.
The mathematical rule is _n-bits has 2<sup>n</sup> unique values_:


1-bit makes 2 unique values: `0` & `1`
  
2-bit makes 4 unique values: `00`, `01`, `10`, `11`
  
4-bit makes 16 unique values ranging from `0000` to `1111`
  
6-bit makes 64 unique values ranging from `000000` to `111111`
  
8-bit makes 256 unique values ranging from `00000000` to `11111111`


### Bytes of Information
In computing, we call an 8-bit pattern a 'byte'. As shown above, this means a single byte can store any number between 0 and 255 (256 unique values). If we need to store numbers higher than 255 then we can use multiple bytes. And as we start to use multiple bytes to represent a single data point, the range of numbers we can represent becomes staggering. As an example a 4-byte number (32 bits) has _4,294,967,296 unique values_ (2<sup>32</sup>)!

"_But not all data we store is numbers_", I hear you cry! "_Some of us want to store text and emojis and stuff_" :face_with_monocle:

That is a great point. Thanks for speaking up.

To solve this problem we create agreements. For example, when a computer is storing text it follows a standard that says the binary number `1100001` represents the letter `a`, the binary number `1100010` represents the letter `b` and so forth. Once such agreement is [ASCII :octicons-link-external-16:{ .external-link-icon }](https://en.wikipedia.org/wiki/ASCII){:target="_blank"}. Different types of data (audio, video etc) have their own agreements so that a computer can understand what the binary being stored represents.

<figure markdown="span">
  ![A digital photo being taken of a beautiful countryside](https://raw.githubusercontent.com/simplytim42/turbo-umbrella/refs/heads/main/tstd/computing-fundamentals/digital-photograph.webp){ width="600", loading=lazy, main-image }
</figure>


## Measuring Data Storage
A single byte is an extremely small unit of storage. You could use it to store a small number or a single character. So it quickly becomes necessary to use a naming standard for large numbers of bytes.

You've likely heard of the term 'kilobyte' before. The prefix 'kilo' is traditionally used to represent 10<sup>3</sup> (10 x 10 x 10 or 1000) as in 'kilometre' and 'kilogram'. For computers, this means a kilobyte should be 1000 bytes…actually it is _roughly_ 1000 bytes.

!!! question "What do you mean 'roughly'?"

    This bit can get confusing (pun intended :smirk:) and does involve a some maths. Because computers are binary beasts, they work best with numbers that are a power of 2. As a result we bend the naming rules a bit. The nearest number to a thousand that is also a power of 2 is 2<sup>10</sup> which is 1,024. Which is why 1 kilobyte = 1,024 bytes.


### Names for Storage
kilobyte = a thousand = `KB` = 2<sup>10</sup> = `1,024 bytes`

megabyte = a million = `MB` = 2<sup>20</sup> = `1,024 KB`

gigabyte = a billion = `GB` = 2<sup>30</sup> = `1,024 MB`

terabyte = a trillion = `TB` = 2<sup>40</sup> = `1,024 GB`

petabyte = a quadrillion = `PB` = 2<sup>50</sup> = `1,024 TB`


## Measuring Data Transmission
_Data transmission_ is the transfer of data from one device to another. That could be from your computer to an external hard drive. It also includes browsing the internet and watching YouTube, as your device has to download the content before you can consume it. Have you ever renewed your internet contract and wondered what the advertised speeds actually meant? This is where we shine a light on that.

Measuring the speed of data transmission differs from measuring data storage. Data is transferred one bit at a time, albeit at an extremely fast rate! This makes measurement simple because we track the number of _bits per second (bps)_ transferred.

We can use the same prefixes as we do for measuring data storage (kilo, Mega, Giga, etc), with the key difference being that we can go back to using powers of 10.

### Names for Transmission Speeds
kilobits per second = a thousand = `kbps` = 10<sup>3</sup> = `1,000 bps`

megabits per second = a million = `Mbps` = 10<sup>6</sup> = `1,000 kbps`

gigabits per second = a billion = `Gbps` = 10<sup>9</sup> = `1,000 Mbps`

terabits per second = a trillion = `Tbps` = 10<sup>12</sup> = `1,000 Gbps`


!!! question "What's up with the little k in kbps?"

    Note the rather confusing inconsistency with capitalisation: the lowercase 'k' represents 1,000 in decimal measurements (used to measure data transmission), unlike data storage which often uses a capital 'K' to denote binary measurement :face_with_spiral_eyes: We are not so consistent with mega, giga etc.


--8<-- "includes/blog_series/computer_science_intro.md"