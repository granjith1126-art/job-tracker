from typing import List, Dict, Any, Optional
import re

INDIAN_STATES_DATA: List[Dict[str, Any]] = [
    {
        "name": "Karnataka",
        "code": "KA",
        "type": "State",
        "cities": ["Bengaluru", "Bangalore", "Mysuru", "Mysore", "Mangaluru", "Mangalore", "Hubballi", "Hubli", "Belagavi", "Belgaum", "Shimoga", "Tumakuru"]
    },
    {
        "name": "Tamil Nadu",
        "code": "TN",
        "type": "State",
        "cities": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Trichy", "Salem", "Tirunelveli", "Erode", "Vellore"]
    },
    {
        "name": "Maharashtra",
        "code": "MH",
        "type": "State",
        "cities": ["Mumbai", "Pune", "Nagpur", "Nashik", "Navi Mumbai", "Thane", "Aurangabad", "Chhatrapati Sambhajinagar", "Kolhapur", "Solapur"]
    },
    {
        "name": "Telangana",
        "code": "TG",
        "type": "State",
        "cities": ["Hyderabad", "Secunderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam"]
    },
    {
        "name": "Delhi",
        "code": "DL",
        "type": "Union Territory",
        "cities": ["Delhi", "New Delhi", "Noida", "Greater Noida", "Gurgaon", "Gurugram", "Faridabad", "Ghaziabad"]
    },
    {
        "name": "Andhra Pradesh",
        "code": "AP",
        "type": "State",
        "cities": ["Visakhapatnam", "Vizag", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Tirupati", "Rajahmundry", "Kakinada"]
    },
    {
        "name": "Kerala",
        "code": "KL",
        "type": "State",
        "cities": ["Kochi", "Cochin", "Thiruvananthapuram", "Trivandrum", "Kozhikode", "Calicut", "Thrissur", "Kollam", "Palakkad", "Kannur"]
    },
    {
        "name": "Gujarat",
        "code": "GJ",
        "type": "State",
        "cities": ["Ahmedabad", "Gandhinagar", "Surat", "Vadodara", "Baroda", "Rajkot", "Bhavnagar", "Jamnagar"]
    },
    {
        "name": "West Bengal",
        "code": "WB",
        "type": "State",
        "cities": ["Kolkata", "Calcutta", "Siliguri", "Durgapur", "Asansol", "Howrah", "Kalyani"]
    },
    {
        "name": "Uttar Pradesh",
        "code": "UP",
        "type": "State",
        "cities": ["Noida", "Greater Noida", "Lucknow", "Kanpur", "Agra", "Varanasi", "Prayagraj", "Allahabad", "Ghaziabad", "Meerut", "Bareilly"]
    },
    {
        "name": "Haryana",
        "code": "HR",
        "type": "State",
        "cities": ["Gurugram", "Gurgaon", "Faridabad", "Panchkula", "Ambala", "Karnal", "Panipat", "Rohtak", "Hisar"]
    },
    {
        "name": "Rajasthan",
        "code": "RJ",
        "type": "State",
        "cities": ["Jaipur", "Udaipur", "Jodhpur", "Kota", "Ajmer", "Bikaner", "Bhilwara", "Alwar"]
    },
    {
        "name": "Punjab",
        "code": "PB",
        "type": "State",
        "cities": ["Mohali", "Chandigarh", "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda"]
    },
    {
        "name": "Madhya Pradesh",
        "code": "MP",
        "type": "State",
        "cities": ["Indore", "Bhopal", "Gwalior", "Jabalpur", "Ujjain", "Sagar"]
    },
    {
        "name": "Odisha",
        "code": "OD",
        "type": "State",
        "cities": ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri"]
    },
    {
        "name": "Bihar",
        "code": "BR",
        "type": "State",
        "cities": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga"]
    },
    {
        "name": "Jharkhand",
        "code": "JH",
        "type": "State",
        "cities": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar"]
    },
    {
        "name": "Assam",
        "code": "AS",
        "type": "State",
        "cities": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tezpur"]
    },
    {
        "name": "Goa",
        "code": "GA",
        "type": "State",
        "cities": ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda"]
    },
    {
        "name": "Chhattisgarh",
        "code": "CG",
        "type": "State",
        "cities": ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg", "Rajnandgaon"]
    },
    {
        "name": "Himachal Pradesh",
        "code": "HP",
        "type": "State",
        "cities": ["Shimla", "Dharamshala", "Solan", "Mandi", "Baddi", "Kullu"]
    },
    {
        "name": "Uttarakhand",
        "code": "UK",
        "type": "State",
        "cities": ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rishikesh", "Nainital"]
    },
    {
        "name": "Jammu and Kashmir",
        "code": "JK",
        "type": "Union Territory",
        "cities": ["Srinagar", "Jammu", "Anantnag", "Baramulla", "Udhampur"]
    },
    {
        "name": "Chandigarh",
        "code": "CH",
        "type": "Union Territory",
        "cities": ["Chandigarh", "Mohali", "Panchkula"]
    },
    {
        "name": "Ladakh",
        "code": "LA",
        "type": "Union Territory",
        "cities": ["Leh", "Kargil"]
    },
    {
        "name": "Puducherry",
        "code": "PY",
        "type": "Union Territory",
        "cities": ["Puducherry", "Pondicherry", "Karaikal", "Yanam", "Mahe"]
    },
    {
        "name": "Sikkim",
        "code": "SK",
        "type": "State",
        "cities": ["Gangtok", "Namchi", "Gyalshing"]
    },
    {
        "name": "Tripura",
        "code": "TR",
        "type": "State",
        "cities": ["Agartala", "Dharmanagar", "Udaipur"]
    },
    {
        "name": "Meghalaya",
        "code": "ML",
        "type": "State",
        "cities": ["Shillong", "Tura", "Jowai"]
    },
    {
        "name": "Manipur",
        "code": "MN",
        "type": "State",
        "cities": ["Imphal", "Thoubal", "Churachandpur"]
    },
    {
        "name": "Nagaland",
        "code": "NL",
        "type": "State",
        "cities": ["Kohima", "Dimapur", "Mokokchung"]
    },
    {
        "name": "Mizoram",
        "code": "MZ",
        "type": "State",
        "cities": ["Aizawl", "Lunglei", "Champhai"]
    },
    {
        "name": "Arunachal Pradesh",
        "code": "AR",
        "type": "State",
        "cities": ["Itanagar", "Naharlagun", "Pasighat", "Tawang"]
    },
    {
        "name": "Andaman and Nicobar Islands",
        "code": "AN",
        "type": "Union Territory",
        "cities": ["Port Blair", "Havelock Island"]
    },
    {
        "name": "Dadra and Nagar Haveli and Daman and Diu",
        "code": "DN",
        "type": "Union Territory",
        "cities": ["Daman", "Diu", "Silvassa"]
    },
    {
        "name": "Lakshadweep",
        "code": "LD",
        "type": "Union Territory",
        "cities": ["Kavaratti", "Agatti"]
    }
]

# Non-Indian Country Keywords to reject in Indian feeds
NON_INDIA_COUNTRIES = [
    "united states", "usa", "us", "united kingdom", "uk", "great britain", "england", "london",
    "canada", "germany", "berlin", "france", "paris", "australia", "sydney", "melbourne",
    "singapore", "netherlands", "amsterdam", "brazil", "russia", "poland", "sweden",
    "ireland", "dublin", "spain", "madrid", "barcelona", "italy", "rome", "austria",
    "switzerland", "zurich", "new zealand", "japan", "tokyo", "israel", "tel aviv",
    "norway", "oslo", "denmark", "copenhagen", "finland", "helsinki", "south africa"
]

ALL_INDIAN_CITIES = []
for state_entry in INDIAN_STATES_DATA:
    ALL_INDIAN_CITIES.extend([c.lower() for c in state_entry["cities"]])

def get_indian_states() -> List[Dict[str, Any]]:
    """Returns the list of Indian States and Union Territories with major cities."""
    return INDIAN_STATES_DATA

def is_in_india(location_str: str) -> bool:
    """
    Validates if a given location string belongs to India (or is an India-permitted remote role).
    Filters out explicit foreign locations (US, UK, Germany, Canada, etc.).
    """
    if not location_str:
        return True

    loc_lower = location_str.lower().strip()

    # 1. Check if it matches foreign countries or locations
    for foreign_country in NON_INDIA_COUNTRIES:
        pattern = r'\b' + re.escape(foreign_country) + r'\b'
        if re.search(pattern, loc_lower):
            return False

    # 2. Check for explicit India keywords
    if "india" in loc_lower or "bharat" in loc_lower or ", in" in loc_lower:
        return True

    # 3. Check if any Indian state or city name is present
    for state_entry in INDIAN_STATES_DATA:
        if state_entry["name"].lower() in loc_lower:
            return True
        for city in state_entry["cities"]:
            pattern = r'\b' + re.escape(city.lower()) + r'\b'
            if re.search(pattern, loc_lower):
                return True

    # 4. Check for Global Remote (e.g. Remote (Worldwide), Remote (Global), Anywhere)
    if "remote" in loc_lower or "worldwide" in loc_lower or "global" in loc_lower or "anywhere" in loc_lower:
        # Reject if restricted to non-India
        if any(f" {c}" in loc_lower or f"- {c}" in loc_lower or f"({c})" in loc_lower for c in ["us only", "usa only", "uk only", "eu only", "europe only", "canada only", "latam only", "emea only", "apac only (excluding india)"]):
            return False
        return True

    # Otherwise: unknown non-Indian specific locality -> reject from India feed
    return False

def matches_indian_state(location_str: str, target_state: str) -> bool:
    """
    Checks if a job location matches a specific Indian state or any of its constituent cities.
    """
    if not target_state or target_state == "All" or target_state == "All States":
        return is_in_india(location_str)

    if not location_str:
        return False

    loc_lower = location_str.lower()
    target_state_clean = target_state.lower().strip()

    # Direct state name match
    if target_state_clean in loc_lower:
        return True

    # Find the state entry to check its cities
    state_entry = next((s for s in INDIAN_STATES_DATA if s["name"].lower() == target_state_clean), None)
    if state_entry:
        for city in state_entry["cities"]:
            pattern = r'\b' + re.escape(city.lower()) + r'\b'
            if re.search(pattern, loc_lower):
                return True

    # Remote jobs that mention India or Global Remote
    if ("remote" in loc_lower or "worldwide" in loc_lower) and ("india" in loc_lower or "global" in loc_lower or "worldwide" in loc_lower):
        return True

    return False
