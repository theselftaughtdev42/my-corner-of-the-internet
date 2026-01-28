---
date:
  created: 2025-01-13
tags:
  - computer-science
  - cs
description: Discover how binary numbers mirror the familiar decimal system and see how counting in twos can be surprisingly simple.
title: Binary Made Easy
series: Intro to Computer Science
---

Binary numbers might seem mystifying at first glance, but this article breaks it down into familiar logic you use every day. By explaining the parallels between counting in tens and counting in twos, you'll be guided to understand how ones and zeros can represent anything!

!!! warning "Joke Alert!"
    
    "There are 10 types of people in this world, those who understand binary and those who don't." – _(Source Unknown)_

    If you don't get this joke now, you will by the end of this article.

---

Many people find binary intimidating, but it's simpler than you think. If you can count, then you can read binary. Today, we will break down this problem by reviewing how we understand numbers and then applying that same logic to binary.

<figure markdown="span">
  ![An abstract painting interweaving technology with swirling clouds.](https://raw.githubusercontent.com/simplytim42/turbo-umbrella/refs/heads/main/tstd/computing-fundamentals/binary.webp){ width="600", loading=lazy, main-image }
</figure>


## Decimal System
In everyday life, when we count we typically use the decimal numbering system. In this system, a single digit is often referred to as a unit:

- 0 = no units
- 1 = one unit
- 2 = two units, etc. 

When we reach ten units, we reset our units to zero and add another digit to the left and then continue incrementing the unit. This new digit to the left represents a multiple of 10, creating the "tens" column. Each column added to the left is another multiple of 10: so the pattern becomes _units, tens, hundreds, thousands_ etc. The table below should be familiar:

| Thousands | Hundreds | Tens | Units | Name | Number |
|:---------:|:--------:|:----:|:-----:|:----:|:------:|
| 0 | 0 | 0 | 1 | One | 1 |
| 0 | 0 | 1 | 0 | Ten | 10 |
| 0 | 1 | 0 | 0 | One Hundred | 100 |
| 1 | 0 | 0 | 0 | One Thousand| 1,000 |
| 2 | 3 | 4 | 5 | Two Thousand Three Hundred Forty-Five | 2,345 |


## Recognising Binary
Decimal numbers can be described as _"a sequence of digits ranging from 0 to 9"_. In the very same fashion, we can describe binary numbers as _"a sequence of digits ranging from 0 to 1"_. The following examples are all binary numbers:

- 11001100
- 0001
- 0
- 1111


## Binary System
The binary numbering system is a cousin to the decimal numbering system. It is used to represent the same numbers, they just look different.

We apply the same process to binary as we do with decimal but use only two digits (0 and 1) and each column is a multiple of 2 instead of 10. This means the pattern for our columns becomes _units, twos, fours, eights, sixteens_ etc.

Take some time to look over this table. Pay close attention to the column names and compare them to the decimal table above. Can you see a pattern?

| Eight | Four | Two | Unit | Name | Binary Number |
|:-----:|:----:|:---:|:----:|:----:|:-------------:|
| 0 | 0 | 0 | 1 | One | `0001` |
| 0 | 0 | 1 | 0 | Two | `0010` |
| 0 | 0 | 1 | 1 | Three | `0011` |
| 0 | 1 | 0 | 0 | Four | `0100` |
| 0 | 1 | 0 | 1 | Five | `0101` |


## Converting Binary to Decimal
In my experience, manually converting a few binary numbers into decimal helps to solidify the concept. Let's use the binary number `101101` as an example.

First, draw the columns around the binary number (remember to use multiples of 2). I will use "one" for clarity instead of "unit".

| Thirty-Two | Sixteen | Eight | Four | Two | One |
|-|-|-|-|-|-|
| 1 | 0 | 1 | 1 | 0 | 1 |

Next, convert each digit based on its position.

| Thirty-Two | Sixteen | Eight | Four | Two | One |
|-|-|-|-|-|-|
| 32 | 0 | 8 | 4 | 0 | 1 |

Lastly, add them up:

$32 + 0 + 8 + 4 + 0 + 1 = 45$

Which means `101101` equals 45. Much easier once you know how it works, right?
