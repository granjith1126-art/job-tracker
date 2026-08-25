import json
from database import SessionLocal, CodingProblemDB, MockTestDB, Base, engine

Base.metadata.create_all(bind=engine)

CODING_PROBLEMS = [
    {
        "slug": "two-sum",
        "title": "Two Sum",
        "difficulty": "Easy",
        "category": "Arrays & Hashing",
        "tags": ["Array", "Hash Table"],
        "description": "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.",
        "input_format": "nums: List[int], target: int",
        "output_format": "List[int] with 2 indices",
        "constraints": [
            "2 <= nums.length <= 10^4",
            "-10^9 <= nums[i] <= 10^9",
            "-10^9 <= target <= 10^9",
            "Only one valid answer exists."
        ],
        "examples": [
            {
                "input": "nums = [2,7,11,15], target = 9",
                "output": "[0, 1]",
                "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."
            },
            {
                "input": "nums = [3,2,4], target = 6",
                "output": "[1, 2]",
                "explanation": "Because nums[1] + nums[2] == 6, we return [1, 2]."
            }
        ],
        "starter_code": {
            "python": "class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        # Write your code here\n        seen = {}\n        for i, n in enumerate(nums):\n            diff = target - n\n            if diff in seen:\n                return [seen[diff], i]\n            seen[n] = i\n        return []\n\ndef twoSum(nums, target):\n    return Solution().twoSum(nums, target)\n",
            "javascript": "function twoSum(nums, target) {\n    // Write your code here\n}\n"
        },
        "test_cases": [
            {"input": [[2, 7, 11, 15], 9], "expected_output": "[0, 1]", "hidden": False},
            {"input": [[3, 2, 4], 6], "expected_output": "[1, 2]", "hidden": False},
            {"input": [[3, 3], 6], "expected_output": "[0, 1]", "hidden": False},
            {"input": [[1, 5, 8, 12, 19], 20], "expected_output": "[0, 4]", "hidden": True}
        ]
    },
    {
        "slug": "valid-parentheses",
        "title": "Valid Parentheses",
        "difficulty": "Easy",
        "category": "Stack",
        "tags": ["String", "Stack"],
        "description": "Given a string `s` containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.",
        "input_format": "s: str",
        "output_format": "bool",
        "constraints": [
            "1 <= s.length <= 10^4",
            "s consists of parentheses only '()[]{}'."
        ],
        "examples": [
            {"input": 's = "()"', "output": "true", "explanation": "Matching parentheses pair."},
            {"input": 's = "()[]{}"', "output": "true", "explanation": "All bracket types match correctly."},
            {"input": 's = "(]"', "output": "false", "explanation": "Mismatched bracket pair."}
        ],
        "starter_code": {
            "python": "class Solution:\n    def isValid(self, s: str) -> bool:\n        stack = []\n        mapping = {')': '(', '}': '{', ']': '['}\n        for char in s:\n            if char in mapping:\n                top_elem = stack.pop() if stack else '#'\n                if mapping[char] != top_elem:\n                    return False\n            else:\n                stack.append(char)\n        return not stack\n\ndef isValid(s):\n    return Solution().isValid(s)\n"
        },
        "test_cases": [
            {"input": "()", "expected_output": "true", "hidden": False},
            {"input": "()[]{}", "expected_output": "true", "hidden": False},
            {"input": "(]", "expected_output": "false", "hidden": False},
            {"input": "{[]}", "expected_output": "true", "hidden": True},
            {"input": "([)]", "expected_output": "false", "hidden": True}
        ]
    },
    {
        "slug": "contains-duplicate",
        "title": "Contains Duplicate",
        "difficulty": "Easy",
        "category": "Arrays & Hashing",
        "tags": ["Array", "Hash Table", "Sorting"],
        "description": "Given an integer array `nums`, return `true` if any value appears at least twice in the array, and return `false` if every element is distinct.",
        "input_format": "nums: List[int]",
        "output_format": "bool",
        "constraints": [
            "1 <= nums.length <= 10^5",
            "-10^9 <= nums[i] <= 10^9"
        ],
        "examples": [
            {"input": "nums = [1,2,3,1]", "output": "true"},
            {"input": "nums = [1,2,3,4]", "output": "false"}
        ],
        "starter_code": {
            "python": "class Solution:\n    def containsDuplicate(self, nums: list[int]) -> bool:\n        return len(nums) != len(set(nums))\n\ndef containsDuplicate(nums):\n    return Solution().containsDuplicate(nums)\n"
        },
        "test_cases": [
            {"input": [1, 2, 3, 1], "expected_output": "true", "hidden": False},
            {"input": [1, 2, 3, 4], "expected_output": "false", "hidden": False},
            {"input": [1, 1, 1, 3, 3, 4, 3, 2, 4, 2], "expected_output": "true", "hidden": True}
        ]
    },
    {
        "slug": "best-time-to-buy-and-sell-stock",
        "title": "Best Time to Buy and Sell Stock",
        "difficulty": "Easy",
        "category": "Two Pointers",
        "tags": ["Array", "Dynamic Programming"],
        "description": "You are given an array `prices` where `prices[i]` is the price of a given stock on the `i`th day.\n\nYou want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.\n\nReturn the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return `0`.",
        "input_format": "prices: List[int]",
        "output_format": "int",
        "constraints": [
            "1 <= prices.length <= 10^5",
            "0 <= prices[i] <= 10^4"
        ],
        "examples": [
            {"input": "prices = [7,1,5,3,6,4]", "output": "5", "explanation": "Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5."},
            {"input": "prices = [7,6,4,3,1]", "output": "0", "explanation": "In this case, no transactions are done and max profit = 0."}
        ],
        "starter_code": {
            "python": "class Solution:\n    def maxProfit(self, prices: list[int]) -> int:\n        min_price = float('inf')\n        max_profit = 0\n        for p in prices:\n            if p < min_price:\n                min_price = p\n            elif p - min_price > max_profit:\n                max_profit = p - min_price\n        return max_profit\n\ndef maxProfit(prices):\n    return Solution().maxProfit(prices)\n"
        },
        "test_cases": [
            {"input": [7, 1, 5, 3, 6, 4], "expected_output": "5", "hidden": False},
            {"input": [7, 6, 4, 3, 1], "expected_output": "0", "hidden": False},
            {"input": [2, 4, 1], "expected_output": "2", "hidden": True}
        ]
    },
    {
        "slug": "valid-anagram",
        "title": "Valid Anagram",
        "difficulty": "Easy",
        "category": "Arrays & Hashing",
        "tags": ["Hash Table", "String", "Sorting"],
        "description": "Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.\n\nAn Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.",
        "input_format": "s: str, t: str",
        "output_format": "bool",
        "constraints": ["1 <= s.length, t.length <= 5 * 10^4", "s and t consist of lowercase English letters."],
        "examples": [
            {"input": 's = "anagram", t = "nagaram"', "output": "true"},
            {"input": 's = "rat", t = "car"', "output": "false"}
        ],
        "starter_code": {
            "python": "class Solution:\n    def isAnagram(self, s: str, t: str) -> bool:\n        return sorted(s) == sorted(t)\n\ndef isAnagram(s, t):\n    return Solution().isAnagram(s, t)\n"
        },
        "test_cases": [
            {"input": ["anagram", "nagaram"], "expected_output": "true", "hidden": False},
            {"input": ["rat", "car"], "expected_output": "false", "hidden": False}
        ]
    },
    {
        "slug": "maximum-subarray",
        "title": "Maximum Subarray (Kadane's)",
        "difficulty": "Medium",
        "category": "Dynamic Programming",
        "tags": ["Array", "Divide and Conquer", "Dynamic Programming"],
        "description": "Given an integer array `nums`, find the subarray with the largest sum, and return its sum.",
        "input_format": "nums: List[int]",
        "output_format": "int",
        "constraints": ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
        "examples": [
            {"input": "nums = [-2,1,-3,4,-1,2,1,-5,4]", "output": "6", "explanation": "The subarray [4,-1,2,1] has the largest sum 6."}
        ],
        "starter_code": {
            "python": "class Solution:\n    def maxSubArray(self, nums: list[int]) -> int:\n        cur_sum = max_sum = nums[0]\n        for n in nums[1:]:\n            cur_sum = max(n, cur_sum + n)\n            max_sum = max(max_sum, cur_sum)\n        return max_sum\n\ndef maxSubArray(nums):\n    return Solution().maxSubArray(nums)\n"
        },
        "test_cases": [
            {"input": [-2, 1, -3, 4, -1, 2, 1, -5, 4], "expected_output": "6", "hidden": False},
            {"input": [1], "expected_output": "1", "hidden": False},
            {"input": [5, 4, -1, 7, 8], "expected_output": "23", "hidden": True}
        ]
    },
    {
        "slug": "longest-substring-without-repeating-characters",
        "title": "Longest Substring Without Repeating Characters",
        "difficulty": "Medium",
        "category": "Sliding Window",
        "tags": ["Hash Table", "String", "Sliding Window"],
        "description": "Given a string `s`, find the length of the longest substring without repeating characters.",
        "input_format": "s: str",
        "output_format": "int",
        "constraints": ["0 <= s.length <= 5 * 10^4", "s consists of English letters, digits, symbols and spaces."],
        "examples": [
            {"input": 's = "abcabcbb"', "output": "3", "explanation": 'The answer is "abc", with the length of 3.'},
            {"input": 's = "bbbbb"', "output": "1", "explanation": 'The answer is "b", with the length of 1.'}
        ],
        "starter_code": {
            "python": "class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        char_map = {}\n        left = 0\n        max_len = 0\n        for right, char in enumerate(s):\n            if char in char_map and char_map[char] >= left:\n                left = char_map[char] + 1\n            char_map[char] = right\n            max_len = max(max_len, right - left + 1)\n        return max_len\n\ndef lengthOfLongestSubstring(s):\n    return Solution().lengthOfLongestSubstring(s)\n"
        },
        "test_cases": [
            {"input": "abcabcbb", "expected_output": "3", "hidden": False},
            {"input": "bbbbb", "expected_output": "1", "hidden": False},
            {"input": "pwwkew", "expected_output": "3", "hidden": False},
            {"input": "", "expected_output": "0", "hidden": True}
        ]
    },
    {
        "slug": "coin-change",
        "title": "Coin Change",
        "difficulty": "Medium",
        "category": "Dynamic Programming",
        "tags": ["Array", "Dynamic Programming", "Breadth-First Search"],
        "description": "You are given an integer array `coins` representing coins of different denominations and an integer `amount` representing a total amount of money.\n\nReturn the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return `-1`.",
        "input_format": "coins: List[int], amount: int",
        "output_format": "int",
        "constraints": ["1 <= coins.length <= 12", "1 <= coins[i] <= 2^31 - 1", "0 <= amount <= 10^4"],
        "examples": [
            {"input": "coins = [1,2,5], amount = 11", "output": "3", "explanation": "11 = 5 + 5 + 1"},
            {"input": "coins = [2], amount = 3", "output": "-1"}
        ],
        "starter_code": {
            "python": "class Solution:\n    def coinChange(self, coins: list[int], amount: int) -> int:\n        dp = [float('inf')] * (amount + 1)\n        dp[0] = 0\n        for coin in coins:\n            for i in range(coin, amount + 1):\n                dp[i] = min(dp[i], dp[i - coin] + 1)\n        return dp[amount] if dp[amount] != float('inf') else -1\n\ndef coinChange(coins, amount):\n    return Solution().coinChange(coins, amount)\n"
        },
        "test_cases": [
            {"input": [[1, 2, 5], 11], "expected_output": "3", "hidden": False},
            {"input": [[2], 3], "expected_output": "-1", "hidden": False},
            {"input": [[1], 0], "expected_output": "0", "hidden": False},
            {"input": [[186, 419, 83, 408], 6249], "expected_output": "20", "hidden": True}
        ]
    },
    {
        "slug": "search-in-rotated-sorted-array",
        "title": "Search in Rotated Sorted Array",
        "difficulty": "Medium",
        "category": "Binary Search",
        "tags": ["Array", "Binary Search"],
        "description": "There is an integer array `nums` sorted in ascending order (with distinct values).\n\nPrior to being passed to your function, `nums` is possibly rotated at an unknown pivot index. Given the array `nums` after the possible rotation and an integer `target`, return the index of `target` if it is in `nums`, or `-1` if it is not in `nums`.\n\nYou must write an algorithm with `O(log n)` runtime complexity.",
        "input_format": "nums: List[int], target: int",
        "output_format": "int",
        "constraints": ["1 <= nums.length <= 5000", "-10^4 <= nums[i] <= 10^4", "All values of nums are unique."],
        "examples": [
            {"input": "nums = [4,5,6,7,0,1,2], target = 0", "output": "4"},
            {"input": "nums = [4,5,6,7,0,1,2], target = 3", "output": "-1"}
        ],
        "starter_code": {
            "python": "class Solution:\n    def search(self, nums: list[int], target: int) -> int:\n        l, r = 0, len(nums) - 1\n        while l <= r:\n            mid = (l + r) // 2\n            if nums[mid] == target:\n                return mid\n            if nums[l] <= nums[mid]:\n                if nums[l] <= target < nums[mid]:\n                    r = mid - 1\n                else:\n                    l = mid + 1\n            else:\n                if nums[mid] < target <= nums[r]:\n                    l = mid + 1\n                else:\n                    r = mid - 1\n        return -1\n\ndef search(nums, target):\n    return Solution().search(nums, target)\n"
        },
        "test_cases": [
            {"input": [[4, 5, 6, 7, 0, 1, 2], 0], "expected_output": "4", "hidden": False},
            {"input": [[4, 5, 6, 7, 0, 1, 2], 3], "expected_output": "-1", "hidden": False},
            {"input": [[1], 0], "expected_output": "-1", "hidden": True}
        ]
    },
    {
        "slug": "trapping-rain-water",
        "title": "Trapping Rain Water",
        "difficulty": "Hard",
        "category": "Two Pointers",
        "tags": ["Array", "Two Pointers", "Dynamic Programming", "Stack"],
        "description": "Given `n` non-negative integers representing an elevation map where the width of each bar is `1`, compute how much water it can trap after raining.",
        "input_format": "height: List[int]",
        "output_format": "int",
        "constraints": ["n == height.length", "1 <= n <= 2 * 10^4", "0 <= height[i] <= 10^5"],
        "examples": [
            {"input": "height = [0,1,0,2,1,0,1,3,2,1,2,1]", "output": "6", "explanation": "6 units of rain water are being trapped."},
            {"input": "height = [4,2,0,3,2,5]", "output": "9"}
        ],
        "starter_code": {
            "python": "class Solution:\n    def trap(self, height: list[int]) -> int:\n        if not height: return 0\n        l, r = 0, len(height) - 1\n        left_max, right_max = height[l], height[r]\n        res = 0\n        while l < r:\n            if left_max < right_max:\n                l += 1\n                left_max = max(left_max, height[l])\n                res += left_max - height[l]\n            else:\n                r -= 1\n                right_max = max(right_max, height[r])\n                res += right_max - height[r]\n        return res\n\ndef trap(height):\n    return Solution().trap(height)\n"
        },
        "test_cases": [
            {"input": [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1], "expected_output": "6", "hidden": False},
            {"input": [4, 2, 0, 3, 2, 5], "expected_output": "9", "hidden": False}
        ]
    }
]

MOCK_TESTS = [
    {
        "slug": "dsa-fundamentals",
        "title": "Data Structures & Algorithms Assessment",
        "category": "Software Engineering",
        "difficulty": "Medium",
        "duration_minutes": 25,
        "description": "Evaluate core concepts in arrays, linked lists, trees, graphs, time complexities, and dynamic programming.",
        "questions": [
            {
                "id": 1,
                "question": "What is the worst-case time complexity of quicksort when the pivot is always the smallest or largest element?",
                "options": ["O(N log N)", "O(N^2)", "O(N)", "O(log N)"],
                "correct_index": 1,
                "explanation": "When unbalanced partitions occur, quicksort degrades to O(N^2) time complexity."
            },
            {
                "id": 2,
                "question": "Which data structure is primarily used to implement Breadth-First Search (BFS) in a graph?",
                "options": ["Stack", "Queue", "Min-Heap", "Binary Search Tree"],
                "correct_index": 1,
                "explanation": "BFS explores nodes level by level using a FIFO Queue."
            },
            {
                "id": 3,
                "question": "What is the average time complexity for searching an element in a balanced Binary Search Tree (AVL / Red-Black Tree)?",
                "options": ["O(1)", "O(log N)", "O(N)", "O(N log N)"],
                "correct_index": 1,
                "explanation": "A self-balancing BST guarantees height h = O(log N), giving O(log N) search."
            },
            {
                "id": 4,
                "question": "Which problem can be solved using Dijkstra's algorithm?",
                "options": ["Minimum Spanning Tree", "Single-source shortest path with non-negative edge weights", "All-pairs shortest path with negative edges", "Topological sorting in a DAG"],
                "correct_index": 1,
                "explanation": "Dijkstra finds single-source shortest paths on graphs with non-negative edge weights."
            },
            {
                "id": 5,
                "question": "In dynamic programming, what are the two essential properties required to apply optimal caching?",
                "options": ["Greedy Choice & Divide and Conquer", "Optimal Substructure & Overlapping Subproblems", "Sorted Input & Binary Partitioning", "Balanced Trees & Heaps"],
                "correct_index": 1,
                "explanation": "Dynamic programming applies when a problem has Optimal Substructure and Overlapping Subproblems."
            }
        ]
    },
    {
        "slug": "machine-learning-ai",
        "title": "Machine Learning & AI Engineering Test",
        "category": "AI & Data",
        "difficulty": "Medium",
        "duration_minutes": 25,
        "description": "Test your mastery in supervised/unsupervised learning, deep neural networks, loss functions, metrics, and transformers.",
        "questions": [
            {
                "id": 1,
                "question": "Which regularization technique adds the sum of absolute values of coefficients (L1 norm) to the loss function?",
                "options": ["Ridge Regression", "Lasso Regression", "Elastic Net (L2 only)", "Dropout"],
                "correct_index": 1,
                "explanation": "Lasso regression adds the L1 penalty, encouraging sparsity in weights."
            },
            {
                "id": 2,
                "question": "What is the primary purpose of Self-Attention in Transformer models?",
                "options": ["To downsample image pixels", "To relate different positions of a single sequence in order to compute a representation", "To reduce GPU memory to zero", "To perform linear regression on tabular data"],
                "correct_index": 1,
                "explanation": "Self-attention computes dynamic contextual attention weights across all tokens in a sequence."
            },
            {
                "id": 3,
                "question": "Which metric is most suitable for evaluating a classification model on highly imbalanced fraud detection data?",
                "options": ["Accuracy", "PR-AUC (Precision-Recall Area Under Curve)", "Mean Squared Error", "R-squared"],
                "correct_index": 1,
                "explanation": "PR-AUC and F1-score focus on minority class detection without being distorted by majority negatives."
            },
            {
                "id": 4,
                "question": "What happens during Gradient Vanishing in deep neural networks with sigmoid activations?",
                "options": ["Gradients grow infinitely large", "Gradients approach zero as backpropagation moves to early layers", "Weights oscillate without converging", "Learning rate doubles automatically"],
                "correct_index": 1,
                "explanation": "Sigmoid derivatives peak at 0.25, causing chained gradients to exponentially decay toward 0."
            },
            {
                "id": 5,
                "question": "What is the primary role of Vector Databases in Retrieval-Augmented Generation (RAG)?",
                "options": ["To compile Python bytecode", "To perform fast approximate nearest neighbor (ANN) similarity search on embeddings", "To store relational customer tables", "To serve CSS stylesheets"],
                "correct_index": 1,
                "explanation": "Vector DBs index dense semantic embeddings and retrieve relevant context chunks via ANN search."
            }
        ]
    },
    {
        "slug": "python-sql-mastery",
        "title": "Python & SQL Professional Assessment",
        "category": "Data & Backend",
        "difficulty": "Easy",
        "duration_minutes": 20,
        "description": "Assess proficiency in Python generators, decorators, memory management, and advanced SQL window functions.",
        "questions": [
            {
                "id": 1,
                "question": "In Python, what is the key difference between a list and a generator expression?",
                "options": ["Lists are immutable; generators are mutable", "Generators produce items lazily on-the-fly using `yield` and consume less memory", "Lists cannot hold strings", "Generators cannot be iterated over"],
                "correct_index": 1,
                "explanation": "Generators evaluate items on demand without allocating the entire collection in memory."
            },
            {
                "id": 2,
                "question": "Which SQL window function assigns a unique sequential integer to each row within a partition with no gaps?",
                "options": ["RANK()", "DENSE_RANK()", "ROW_NUMBER()", "NTILE()"],
                "correct_index": 2,
                "explanation": "ROW_NUMBER() always assigns consecutive integers (1, 2, 3...) regardless of duplicate values."
            },
            {
                "id": 3,
                "question": "What is the output of `bool([])` and `bool({})` in Python?",
                "options": ["True, True", "False, False", "True, False", "Error"],
                "correct_index": 1,
                "explanation": "Empty collections (lists, dicts, tuples, sets) evaluate to False in boolean context."
            },
            {
                "id": 4,
                "question": "What does a SQL `HAVING` clause do compared to a `WHERE` clause?",
                "options": ["Filters rows before aggregation", "Filters grouped records after aggregate functions (e.g. SUM, COUNT) are calculated", "Sorts the final query result", "Creates a temporary index"],
                "correct_index": 1,
                "explanation": "WHERE filters rows before grouping; HAVING filters aggregated groups."
            },
            {
                "id": 5,
                "question": "What is the purpose of the Python `@property` decorator?",
                "options": ["To make a class abstract", "To define getter/setter methods that can be accessed like regular attributes", "To run code asynchronously", "To enforce strict typing at runtime"],
                "correct_index": 1,
                "explanation": "@property allows defining methods accessed like attributes with custom getter logic."
            }
        ]
    },
    {
        "slug": "cloud-devops-systems",
        "title": "Cloud, Docker & DevOps Architecture",
        "category": "Cloud & Infrastructure",
        "difficulty": "Medium",
        "duration_minutes": 25,
        "description": "Test understanding of containerization, Kubernetes pods, CI/CD pipelines, and cloud networking.",
        "questions": [
            {
                "id": 1,
                "question": "In Docker, what is the difference between `CMD` and `ENTRYPOINT` in a Dockerfile?",
                "options": ["CMD cannot take arguments; ENTRYPOINT can", "ENTRYPOINT sets the default executable, while CMD provides default arguments that can be overridden", "CMD runs during image build; ENTRYPOINT runs at container startup", "There is no difference"],
                "correct_index": 1,
                "explanation": "ENTRYPOINT configures the primary command, while CMD specifies default overrideable arguments."
            },
            {
                "id": 2,
                "question": "In Kubernetes, which controller ensures that a specified number of Pod replicas are running at all times?",
                "options": ["ReplicaSet", "Ingress", "ConfigMap", "DaemonSet"],
                "correct_index": 0,
                "explanation": "ReplicaSet maintains a stable set of replica Pods running at any given time."
            },
            {
                "id": 3,
                "question": "What is Infrastructure as Code (IaC) with tools like Terraform primarily designed to achieve?",
                "options": ["Manual configuration via cloud GUI", "Declarative, version-controlled, reproducible provisioning of cloud infrastructure", "Compiling C++ to WebAssembly", "Creating CSS design tokens"],
                "correct_index": 1,
                "explanation": "IaC defines cloud infrastructure in declarative configuration files that can be versioned and tested."
            },
            {
                "id": 4,
                "question": "Which HTTP status code indicates that a client must authenticate itself to get the requested response?",
                "options": ["400 Bad Request", "401 Unauthorized", "403 Forbidden", "404 Not Found"],
                "correct_index": 1,
                "explanation": "401 Unauthorized signals missing or invalid authentication credentials."
            },
            {
                "id": 5,
                "question": "What is the primary benefit of Blue-Green deployment strategy?",
                "options": ["Zero-downtime releases and rapid instantaneous rollback capability", "Reducing server count to one", "Eliminating database migrations", "Auto-generating test cases"],
                "correct_index": 0,
                "explanation": "Blue-Green deployment runs two identical environments, enabling zero downtime by switching router traffic."
            }
        ]
    }
]

def seed():
    db = SessionLocal()
    
    # 1. Seed Coding Problems
    for p in CODING_PROBLEMS:
        existing = db.query(CodingProblemDB).filter(CodingProblemDB.slug == p["slug"]).first()
        if not existing:
            new_p = CodingProblemDB(
                slug=p["slug"],
                title=p["title"],
                difficulty=p["difficulty"],
                category=p["category"],
                tags=json.dumps(p["tags"]),
                description=p["description"],
                input_format=p["input_format"],
                output_format=p["output_format"],
                constraints=json.dumps(p["constraints"]),
                examples=json.dumps(p["examples"]),
                starter_code=json.dumps(p["starter_code"]),
                test_cases=json.dumps(p["test_cases"])
            )
            db.add(new_p)
            print(f"Seeded problem: {p['title']}")
            
    # 2. Seed Mock Tests
    for t in MOCK_TESTS:
        existing = db.query(MockTestDB).filter(MockTestDB.slug == t["slug"]).first()
        if not existing:
            new_t = MockTestDB(
                slug=t["slug"],
                title=t["title"],
                category=t["category"],
                difficulty=t["difficulty"],
                duration_minutes=t["duration_minutes"],
                description=t["description"],
                questions=json.dumps(t["questions"])
            )
            db.add(new_t)
            print(f"Seeded test: {t['title']}")

    db.commit()
    db.close()
    print("Seeding completed successfully!")

if __name__ == "__main__":
    seed()