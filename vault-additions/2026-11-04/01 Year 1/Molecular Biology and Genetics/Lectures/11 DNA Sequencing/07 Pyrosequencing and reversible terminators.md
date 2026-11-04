---
title: "Pyrosequencing and reversible terminators"
aliases: ["Pyrosequencing and reversible terminators"]
tags: [genetics, topic]
type: topic
subject: Molecular Biology and Genetics
part_of: "DNA Sequencing (Lecture 11)"
kind: lecture
semester: Autumn
summary: "Pyrosequencing detects light from released pyrophosphate; reversible terminators add one fluorescent base per cycle"
source: "Lecture 11: DNA Sequencing, Prof Richard Bowater (PowerPoint)"
cssclasses: [subject-genetics, page-topic]
created: 2026-11-04
updated: 2026-11-04
---
# Pyrosequencing and reversible terminators

> [!path] [[Molecular Biology and Genetics]] › [[DNA Sequencing (Lecture 11)]]

*Source: Lecture 11: DNA Sequencing, Prof Richard Bowater (PowerPoint), slides 17-19*

## [[Pyrosequencing]]
- DNA is synthesised from the template **one nucleotide at a time**, each addition giving a **pulse of light**
  1. One dNTP (e.g. dATP) is pulsed in. If it is not the next base, there is **no flash** and **apyrase** destroys it
  2. If it is incorporated, **pyrophosphate (PPi)** is released
  3. **Sulfurylase** converts PPi into **ATP**
  4. **Luciferase** uses the ATP to oxidise luciferin: a **flash of light**
- Two identical bases in a row give a **2× brighter flash**
- Each fragment is on a bead in a tiny well (454 sequencing)
- Reads **400 to 500 nucleotides**

## [[Reversible terminator sequencing]]
1. All four nucleotides are added, each with a **different fluorescent label** and a **blocking group** on the 3′ end, so only **one base is added per cycle**
2. The colour at each cluster is **recorded** (e.g. thymine added, yellow)
3. The **labels and blocking groups are removed**, washed away and the next blocked labelled nucleotides added
- Used by **Illumina**: millions of fragments sequenced at the same time in each channel of a **flow cell**

> [!quote] Shendure et al. (2017) Nature
> Incorporation of dNTPs releases pyrophosphate, which powers the generation of light by firefly luciferase.

> [!figure] Pyrosequencing: a dNTP pulse, pyrophosphate to ATP, luciferase flash (Lecture 11, slide 18)
> ![[mg11_s18.jpg]]

> [!figure] Reversible terminator sequencing: add a blocked fluorescent base, image, remove label and block (Lecture 11, slide 19)
> ![[mg11_s19.jpg]]

## Questions
> [!question]- In pyrosequencing, what produces the flash of light?
> Incorporation of a nucleotide releases pyrophosphate, which sulfurylase converts to ATP; luciferase uses the ATP to oxidise luciferin, giving light.

> [!question]- In pyrosequencing, what happens if a pulsed dNTP is not complementary to the next template base?
> It is not incorporated, so no flash is seen, and apyrase degrades it.

> [!question]- How does pyrosequencing show two identical bases in a row?
> Both are incorporated in one pulse, giving a flash about twice as bright.

> [!question]- How long are pyrosequencing reads?
> 400 to 500 nucleotides.

> [!question]- Why do the nucleotides in reversible terminator sequencing carry a blocking group?
> So only one nucleotide is added per cycle; after its fluorescent colour is recorded the label and block are removed so the next one can be added.
