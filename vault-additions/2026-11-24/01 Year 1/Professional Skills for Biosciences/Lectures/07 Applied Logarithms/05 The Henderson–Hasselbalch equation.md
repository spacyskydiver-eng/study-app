---
title: "The Henderson–Hasselbalch equation"
aliases: ["The Henderson–Hasselbalch equation"]
tags: [skills, topic]
type: topic
subject: Professional Skills for Biosciences
part_of: "Applied Logarithms (Maths 5)"
kind: lecture
semester: Year-long
summary: "Derived from Ka with the log laws: pH = pKa + log([A⁻]/[HA])"
source: "Mathematical Concepts: Applied Logarithms, Dr Beth Williams (PowerPoint)"
cssclasses: [subject-skills, page-topic]
created: 2026-11-24
updated: 2026-11-24
---
# The Henderson–Hasselbalch equation

> [!path] [[Professional Skills for Biosciences]] › [[Applied Logarithms (Maths 5)]]

*Source: Mathematical Concepts: Applied Logarithms, Dr Beth Williams (PowerPoint), slides 19-25*

## Derivation
1. HA ⇌ H⁺ + A⁻, so **Ka = [H⁺][A⁻] / [HA]**
2. [H⁺] = Ka[HA] / [A⁻]
3. Take logs (law 1, law 2): log[H⁺] = log Ka + log[HA] − log[A⁻]
4. × (−1): −log[H⁺] = −log Ka − log[HA] + log[A⁻]
5. pH = pKa − log[HA] + log[A⁻] (pKa = −log Ka)
6. Law 2 again: **pH = pKa + log([A⁻]/[HA])** = pKa + log([base]/[acid])

## Example 1
- 0.2 M acetic acid + 0.05 M sodium acetate, pKa 4.7
- pH = 4.7 + log(0.05/0.2) = 4.7 − 0.6 = **4.1**

## Example 2: account for mixing first
- 100 mL of 0.1 M acetic acid + 300 mL of 0.2 M sodium acetate (total 400 mL)
- C(acid) = 0.1 × 0.1 / 0.4 = **0.025 M**; C(acetate) = 0.2 × 0.3 / 0.4 = **0.15 M**
- pH = 4.7 + log(0.15/0.025) = 4.7 + 0.78 = **5.5**

> [!tip] Estimate first
> More base than acid → pH above pKa; more acid → pH below pKa; equal → pH = pKa

## Questions
> [!question]- 0.2 M acetic acid + 0.05 M acetate, pKa 4.7. pH?
> 4.7 + log(0.25) = 4.1.

> [!question]- 100 mL 0.1 M acetic acid + 300 mL 0.2 M acetate, pKa 4.7. pH?
> Concentrations 0.025 and 0.15 M; pH = 4.7 + log 6 = 5.5.
