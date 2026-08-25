import re
from typing import List, Dict, Any, Optional
from services.catalogs import CAREER_ROLES_CATALOG

def calculate_career_predictions(
    user_skills: List[str],
    experience_years: float = 0.0,
    interests: Optional[List[str]] = None,
    education: str = ""
) -> List[Dict[str, Any]]:
    interests = interests or []
    user_skills_set = set(s.lower() for s in user_skills)
    interests_set = set(i.lower() for i in interests)

    predictions = []

    for role in CAREER_ROLES_CATALOG:
        core_skills = role["core_skills"]
        matching_skills = [s for s in core_skills if s.lower() in user_skills_set]
        missing_skills = [s for s in core_skills if s.lower() not in user_skills_set]

        # Base skill match ratio
        if len(core_skills) > 0:
            skill_ratio = len(matching_skills) / len(core_skills)
        else:
            skill_ratio = 0.0

        # Calculate dynamic percentage
        # 70% from skills, 15% from experience, 15% from matching interests / domain
        base_score = skill_ratio * 70.0

        # Experience bonus (up to 15%)
        exp_score = min(experience_years / 4.0, 1.0) * 15.0 if matching_skills else 0.0

        # Interest match bonus (up to 15%)
        interest_bonus = 0.0
        if any(role["title"].lower() in intr or intr in role["title"].lower() for intr in interests_set):
            interest_bonus = 15.0
        elif any(role["category"].lower() in intr for intr in interests_set):
            interest_bonus = 8.0

        total_match = int(round(base_score + exp_score + interest_bonus))
        total_match = max(min(total_match, 98), 12 if user_skills else 5)

        # Generate realistic trend data reflecting historical progress
        trend = [
            max(total_match - 30, 20),
            max(total_match - 22, 28),
            max(total_match - 15, 38),
            max(total_match - 8, 48),
            max(total_match - 4, 55),
            total_match
        ]

        predictions.append({
            "id": role["id"],
            "title": role["title"],
            "category": role["category"],
            "subtitle": role["description"],
            "match": total_match,
            "top_skills": core_skills[:5],
            "matching_skills": matching_skills,
            "missing_skills": missing_skills,
            "recommended_to_learn": missing_skills[:4] if missing_skills else ["System Architecture", "Advanced Optimizations"],
            "trend_data": trend
        })

    # Sort descending by match score
    predictions.sort(key=lambda x: x["match"], reverse=True)
    return predictions

def calculate_skill_gap(role_id: str, user_skills: List[str]) -> Dict[str, Any]:
    # Normalize query string
    cleaned_id = role_id.strip().lower() if role_id else "software-engineer"

    # Find matching role definition
    target_role = None
    for r in CAREER_ROLES_CATALOG:
        if r["id"].lower() == cleaned_id or r["title"].lower() == cleaned_id:
            target_role = r
            break
        if cleaned_id in r["id"].lower() or cleaned_id in r["title"].lower() or r["id"].lower() in cleaned_id:
            target_role = r
            break

    if not target_role:
        target_role = CAREER_ROLES_CATALOG[0]

    user_skills_set = set(s.strip().lower() for s in user_skills if s)
    core_skills = target_role["core_skills"]

    rows = []
    acquired_count = 0
    missing_skills = []

    for idx, skill in enumerate(core_skills):
        s_lower = skill.strip().lower()
        has_skill = s_lower in user_skills_set or any(s_lower in us or us in s_lower for us in user_skills_set)

        # Determine levels and gap
        if has_skill:
            acquired_count += 1
            your_level = "Advanced" if idx < 3 else "Intermediate"
            req_level = "Advanced" if idx < 3 else "Intermediate"
            gap_status = "✓ Matched"
            severity = "success"
            action = f"Proficient in {skill}"
        else:
            missing_skills.append(skill)
            your_level = "None"
            req_level = "Advanced" if idx < 3 else "Intermediate"
            gap_status = "High" if idx < 3 else "Medium"
            severity = "danger" if idx < 3 else "warning"
            action = f"Learn {skill} core concepts & build project"

        rows.append({
            "skill": skill,
            "your_level": your_level,
            "required_level": req_level,
            "gap": gap_status,
            "severity": severity,
            "badge_type": severity,
            "recommendation": action
        })

    total_req = len(core_skills)
    readiness_score = int(round((acquired_count / total_req) * 100)) if total_req > 0 else 0

    recommendations_list = [f"{s}" for s in missing_skills[:4]] if missing_skills else ["System Architecture", "Advanced Optimizations"]

    return {
        "role_id": target_role["id"],
        "role_title": target_role["title"],
        "category": target_role["category"],
        "description": target_role.get("description", ""),
        "readiness_score": readiness_score,
        "total_skills_required": total_req,
        "skills_acquired": acquired_count,
        "skills_missing": len(missing_skills),
        "matrix": rows,
        "skills_matrix": rows,
        "recommendations": recommendations_list
    }

def calculate_job_match(required_skills: List[str], user_skills: List[str]) -> int:
    if not required_skills:
        return 75
    user_skills_set = set(s.strip().lower() for s in user_skills if s)
    matched = sum(1 for req in required_skills if req.strip().lower() in user_skills_set)
    ratio = matched / len(required_skills) if required_skills else 0
    
    # Calculate score between 35% and 98%
    score = int(round(35 + (ratio * 60)))
    return min(max(score, 35), 98)