---
title: "PCR extras: fingerprinting and qPCR"
aliases: ["PCR extras: fingerprinting and qPCR"]
tags: [genetics, topic]
type: topic
subject: Molecular Biology and Genetics
part_of: "DNA Sequencing (Lecture 11)"
kind: lecture
semester: Autumn
summary: "DNA fingerprinting, PCR from RNA and real-time quantitative PCR (TaqMan)"
source: "Lecture 11: DNA Sequencing, Prof Richard Bowater (PowerPoint)"
cssclasses: [subject-genetics, page-topic]
created: 2026-11-04
updated: 2026-11-04
---
# PCR extras: fingerprinting and qPCR

> [!path] [[Molecular Biology and Genetics]] › [[DNA Sequencing (Lecture 11)]]

*Source: Lecture 11: DNA Sequencing, Prof Richard Bowater (PowerPoint), slides 1-6*

The start of this lecture finishes off [[Polymerase Chain Reaction (Lecture 10)|Lecture 10]].

## DNA fingerprinting
- **[[DNA fingerprinting]]** is used in **forensic science**
- First developed in the **1980s** by **Prof Alec Jeffreys** and colleagues at the **University of Leicester**
- Later versions use **PCR**:
  1. Primers either side of an **STR locus** (a short repeat such as TCTA) amplify it. Different alleles have different numbers of repeats (e.g. 7 or 10), so the products differ in length
  2. **Capillary electrophoresis** separates the fluorescent products by size and a laser detects them

## PCR with RNA as a template
- To copy RNA into DNA needs a different enzyme, **reverse transcriptase** ([[Reverse transcription PCR|RT-PCR]])
- Reactions can be set up in a **quantitative** format, **qPCR** ([[Real-time PCR|real-time PCR]])
- **Fluorescent dyes** that **intercalate** into double-stranded DNA, or probes that report a specific sequence, show how much product there is **in real time**

## TaqMan
- **[[TaqMan probe|TaqMan]]** is one method of qPCR
  1. **Hybridisation**: the two primers and a **TaqMan probe** bind the target. The probe has a **reporter (R)** dye and a **quencher (Q)**. While the probe is intact the quencher stops the reporter emitting
  2. **Extension**: as the polymerase extends the primer it reaches the probe and **cleaves off the reporter**, which is now away from the quencher and **fluoresces** when excited by a laser
  3. **Detection**: the light is measured each cycle and plotted to show the amount of PCR product

## PCR overview
- PCR amplifies DNA to make many copies of the same sequence
- Primers are made complementary to the sequences **flanking** the region to amplify
- All the DNA polymerases used are **thermostable** but differ in properties such as **fidelity**
- PCR can use RNA as a template, and qPCR uses fluorescent dyes to measure RNA levels in real time

> [!quote] Klug 12e, p. 469
> Historically, the most commonly used method of DNA sequencing was developed by Fred Sanger and colleagues during the 1970s and is known as dideoxy chain-termination sequencing or simply Sanger sequencing.

> [!figure] DNA fingerprinting: PCR of an STR locus, then capillary electrophoresis (Lecture 11, slide 3)
> ![[mg11_s03.jpg]]

> [!figure] TaqMan qPCR: the polymerase cleaves the probe, separating reporter from quencher (Lecture 11, slide 5)
> ![[mg11_s05.jpg]]

## Questions
> [!question]- Who first developed DNA fingerprinting, and where?
> Prof Alec Jeffreys and colleagues at the University of Leicester, in the 1980s.

> [!question]- How is PCR used in modern DNA fingerprinting?
> Primers flanking short tandem repeat (STR) loci amplify them; alleles with different numbers of repeats give products of different length, separated by capillary electrophoresis.

> [!question]- What enzyme is needed to use RNA as a PCR template?
> Reverse transcriptase, which copies the RNA into cDNA.

> [!question]- How does a TaqMan probe report the amount of PCR product?
> The probe carries a reporter and a quencher; when the polymerase extends through it, it cleaves off the reporter, which is no longer quenched and fluoresces, so the light rises with the product.
