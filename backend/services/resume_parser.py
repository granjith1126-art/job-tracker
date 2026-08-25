import io
import re
from typing import List, Dict, Any, Optional
from pypdf import PdfReader
import docx
from services.catalogs import SKILLS_CATALOG

KNOWN_SKILLS = [s["name"] for s in SKILLS_CATALOG]

DEGREE_PATTERNS = [
    (r'\b(Ph\.?D|Doctor of Philosophy)\b', "Ph.D. in Computer Science & Engineering"),
    (r'\b(M\.?Tech|Master of Technology)\b[^\n,.]*', "M.Tech in Computer Science / AI"),
    (r'\b(M\.?S|Master of Science)\b[^\n,.]*', "M.S. in Computer Science & Data Systems"),
    (r'\b(MCA|Master of Computer Applications)\b', "Master of Computer Applications (MCA)"),
    (r'\b(B\.?Tech|Bachelor of Technology)\b[^\n,.]*', "B.Tech in Computer Science & Engineering"),
    (r'\b(B\.?E|Bachelor of Engineering)\b[^\n,.]*', "B.E. in Computer Engineering"),
    (r'\b(B\.?S|Bachelor of Science)\b[^\n,.]*', "B.S. in Computer Science / Analytics"),
    (r'\b(BCA|Bachelor of Computer Applications)\b', "Bachelor of Computer Applications (BCA)"),
    (r'\b(Bachelor of Commerce|B\.?Com)\b', "Bachelor of Commerce (B.Com)"),
    (r'\b(Bachelor of Business Administration|BBA)\b', "Bachelor of Business Administration (BBA)"),
]

def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    fn = filename.lower()
    if fn.endswith(".pdf"):
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            text = ""
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            return text.strip()
        except Exception:
            try:
                return file_bytes.decode("utf-8", errors="ignore")
            except Exception:
                return ""
    elif fn.endswith(".docx") or fn.endswith(".doc"):
        try:
            doc = docx.Document(io.BytesIO(file_bytes))
            text = "\n".join([p.text for p in doc.paragraphs if p.text])
            return text.strip()
        except Exception:
            try:
                return file_bytes.decode("utf-8", errors="ignore")
            except Exception:
                return ""
    else:
        try:
            return file_bytes.decode("utf-8", errors="ignore").strip()
        except Exception:
            return ""

def extract_skills_genuinely(text: str) -> List[str]:
    if not text:
        return []
    
    found_skills = []
    text_lower = text.lower()

    for skill in KNOWN_SKILLS:
        # Match word boundaries
        s_lower = skill.lower()
        if s_lower in ["c", "r"]:
            pattern = r'(?:\b|[\s,/_-])' + re.escape(skill) + r'(?:\b|[\s,/_-])'
            if re.search(pattern, text):
                if skill not in found_skills:
                    found_skills.append(skill)
        else:
            pattern = r'\b' + re.escape(s_lower) + r'\b'
            if re.search(pattern, text_lower):
                if skill not in found_skills:
                    found_skills.append(skill)

    return found_skills

def extract_education_details(text: str) -> Dict[str, Any]:
    if not text:
        return {"education": "Not detected", "university": "Not detected", "cgpa": 0.0, "graduation_year": 2025}

    # 1. Degree
    degree = None
    for pattern, deg_name in DEGREE_PATTERNS:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            degree = m.group(0).strip()
            if len(degree) > 50:
                degree = deg_name
            break

    # 2. CGPA / GPA
    cgpa = 0.0
    cgpa_m = re.search(r'\b(cgpa|gpa|percentage)[\s:]*([0-9]+(?:\.[0-9]+)?)(?:\s*/\s*10|\s*/\s*4|%)?', text, re.IGNORECASE)
    if cgpa_m:
        try:
            val = float(cgpa_m.group(2))
            if val > 10 and val <= 100:
                val = round(val / 10, 1)
            cgpa = val
        except ValueError:
            pass

    # 3. Graduation Year
    grad_year = None
    year_matches = re.findall(r'\b(20[123]\d)\b', text)
    if year_matches:
        years = [int(y) for y in year_matches]
        grad_year = max(years)

    # 4. University
    university = None
    uni_patterns = [
        r'([A-Za-z\s]+(Institute|University|College|Academy|IIT|NIT|BITS|IIIT)[A-Za-z\s]*)',
        r'([A-Za-z\s]+School of [A-Za-z\s]+)'
    ]
    for up in uni_patterns:
        m = re.search(up, text)
        if m:
            clean_uni = m.group(1).strip()
            if 4 < len(clean_uni) < 60:
                university = clean_uni
                break

    return {
        "education": degree if degree else "Not detected",
        "university": university if university else "Not detected",
        "cgpa": cgpa if cgpa > 0 else 0.0,
        "graduation_year": grad_year if grad_year else 2025
    }

def extract_experience_info(text: str, skills: List[str]) -> Dict[str, Any]:
    if not text:
        return {"experience_years": 0.0, "experience_summary": "Not detected", "projects_detected": 0}

    # 1. Experience Years
    exp_years = 0.0
    m_exp = re.search(r'(\d+(?:\.\d+)?)\s*(?:\+|plus)?\s*(?:years?|yrs?)(?:\s*of)?\s*(?:experience|exp)?', text, re.IGNORECASE)
    if m_exp:
        try:
            exp_years = float(m_exp.group(1))
        except ValueError:
            pass
    else:
        # Detect date ranges e.g. 2021 - 2024
        spans = re.findall(r'\b(20[12]\d)\s*[-–—to]+\s*(20[12]\d|present|current)\b', text, re.IGNORECASE)
        if spans:
            total_months = 0
            for start, end in spans:
                s_y = int(start)
                e_y = 2026 if end.lower() in ["present", "current"] else int(end)
                if e_y >= s_y:
                    total_months += (e_y - s_y) * 12
            if total_months > 0:
                exp_years = round(min(total_months / 12, 15.0), 1)

    # 2. Projects count
    project_matches = len(re.findall(r'\b(project|developed|engineered|implemented|architected)\b', text, re.IGNORECASE))
    
    # 3. Summary
    if skills:
        top_skills_str = ", ".join(skills[:5])
        if exp_years > 0:
            summary = f"Identified {exp_years} years of background with verified skills in {top_skills_str}. Experience in software projects and technical workflows."
        else:
            summary = f"Entry-level candidate profile with core technical proficiencies in {top_skills_str} and academic/project hands-on experience."
    else:
        summary = "Resume parsed. No standard technical keywords detected in document."

    return {
        "experience_years": exp_years,
        "experience_summary": summary,
        "projects_detected": project_matches
    }

def parse_resume(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    raw_text = extract_text_from_file(file_bytes, filename)
    skills = extract_skills_genuinely(raw_text)
    edu_info = extract_education_details(raw_text)
    exp_info = extract_experience_info(raw_text, skills)

    return {
        "filename": filename,
        "raw_text": raw_text,
        "skills": skills,
        "education": edu_info["education"],
        "university": edu_info["university"],
        "cgpa": edu_info["cgpa"],
        "graduation_year": edu_info["graduation_year"],
        "experience_years": exp_info["experience_years"],
        "experience_summary": exp_info["experience_summary"],
        "raw_text_length": len(raw_text)
    }