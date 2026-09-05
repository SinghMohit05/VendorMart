import urllib.request
import json

candidates = {
    # 1. Ashirvaad Atta (Flour)
    1: [
        "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800", # bakery flour
        "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800", # wheat
        "https://images.unsplash.com/photo-1627483262112-039e9a0a0f16?w=800", # flour
    ],
    # 2. Fortune Sunflower Oil
    2: [
        "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800", # olive/sunflower oil
        "https://images.unsplash.com/photo-1620706857370-e1b9770e8bb1?w=800", # oil bottle
        "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800", # cooking oil
        "https://images.unsplash.com/photo-1607672632458-9eb56696346b?w=800",
    ],
    # 3. Daawat Basmati Rice
    3: [
        "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800", # rice bowl
        "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=800",
    ],
    # 4. Tata Salt
    4: [
        "https://images.unsplash.com/photo-1518110903416-83c74900a0be?w=800", # salt
        "https://images.unsplash.com/photo-1607672632458-9eb56696346b?w=800", # salt crystals
        "https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?w=800", # salt cellar
        "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800",
    ],
    # 5. Toor Dal
    5: [
        "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800", # lentils
        "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=800", # pulses
        "https://images.unsplash.com/photo-1599940824399-b87987cb9723?w=800",
    ],
    # 6. Sugar
    6: [
        "https://images.unsplash.com/photo-1581447109200-bf276912b489?w=800", # sugar
        "https://images.unsplash.com/photo-1622484212850-cab596d63c5d?w=800", # sugar cubes
        "https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=800", # bowl of sugar
    ],
    # 7. Red Label Tea
    7: [
        "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800", # tea
        "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800", # tea cup/leaves
    ],
    # 8. Nestle Maggi
    8: [
        "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=800", # noodles
        "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800", # ramen/noodles
        "https://images.unsplash.com/photo-1552611052-33e04de081de?w=800", # instant noodles
    ],
    # 9. Ketchup
    9: [
        "https://images.unsplash.com/photo-1585325701165-351af916e581?w=800", # ketchup bottle
        "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800",
    ],
    # 10. Garlic Paste
    10: [
        "https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=800", # garlic
        "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800", # garlic cloves
        "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800",
    ],
    # 11. Green Moong Dal
    11: [
        "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=800",
        "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800", # beans/mung
        "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=800",
    ],
    # 12. Pasta
    12: [
        "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800", # pasta
        "https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=800",
    ],
    # 13. Poha
    13: [
        "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800", # grain bowl
        "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=800", # Indian breakfast bowl
        "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800",
    ],
    # 14. Black Pepper
    14: [
        "https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=800", # peppercorns
        "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800",
    ],
    # 15. Honey
    15: [
        "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800", # honey jar
        "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800",
    ],
    # 16. Turmeric Powder
    16: [
        "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800",
        "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=800", # turmeric
        "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800",
    ],
    # 17. Fresh Tomatoes
    17: [
        "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800", # red tomatoes
        "https://images.unsplash.com/photo-1546470427-e26264be0b11?w=800",
        "https://images.unsplash.com/photo-1561136594-7f68413baa99?w=800",
    ],
    # 18. Red Onions
    18: [
        "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=800", # onions
        "https://images.unsplash.com/photo-1580201092675-a0a6a6cafbb1?w=800",
        "https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?w=800",
    ],
    # 19. Potatoes
    19: [
        "https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?w=800", # potatoes
        "https://images.unsplash.com/photo-1508313880080-c4bef0730395?w=800", # raw potatoes
        "https://images.unsplash.com/photo-1590165482129-1b8b27698980?w=800",
    ],
    # 20. Fresh Spinach
    20: [
        "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800", # spinach
        "https://images.unsplash.com/photo-1574316071802-0d684efa7cd5?w=800",
    ],
    # 21. Banana
    21: [
        "https://images.unsplash.com/photo-1528825871115-3581a5387919?w=800", # bananas
        "https://images.unsplash.com/photo-1571771894821-ad9b5886479b?w=800",
        "https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=800",
    ],
    # 22. Apples
    22: [
        "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=800", # apples
        "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=800",
    ],
    # 23. Green Chillies
    23: [
        "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=800", # chillies
        "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800",
        "https://images.unsplash.com/photo-1597113366853-9a93ad3ff2e4?w=800",
    ],
    # 24. Ginger
    24: [
        "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=800", # ginger
        "https://images.unsplash.com/photo-1599940824399-b87987cb9723?w=800",
        "https://images.unsplash.com/photo-1599940824399-b87987cb9723?w=800",
        "https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=800",
    ],
    # 25. Lemons
    25: [
        "https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=800", # lemons
        "https://images.unsplash.com/photo-1533082824266-ba7404a49c66?w=800",
    ],
    # 26. Cauliflower
    26: [
        "https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=800", # cauliflower
        "https://images.unsplash.com/photo-1510627489930-0c1b0baead43?w=800",
    ],
    # 27. Carrots
    27: [
        "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=800", # carrots
        "https://images.unsplash.com/photo-1447175008436-054170c2e979?w=800",
    ],
    # 28. Cucumber
    28: [
        "https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=800", # cucumber
        "https://images.unsplash.com/photo-1449300079323-02e209d9d02d?w=800",
    ],
    # 29. Fresh Milk
    29: [
        "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800", # milk
        "https://images.unsplash.com/photo-1563636619-e910f01ff184?w=800",
    ],
    # 30. Amul Butter
    30: [
        "https://images.unsplash.com/photo-1589923188900-85dae523342b?w=800", # butter
        "https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=800",
    ],
    # 31. Fresh Brown Bread
    31: [
        "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800", # bread
        "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=800",
    ],
    # 32. Paneer
    32: [
        "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800", # cottage cheese/paneer
        "https://images.unsplash.com/photo-1601050633647-81a317577a36?w=800",
        "https://images.unsplash.com/photo-1559561853-08451507cbe7?w=800",
    ],
    # 33. Fresh Eggs
    33: [
        "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=800", # eggs in tray
        "https://images.unsplash.com/photo-1506976785307-8732e75ad53e?w=800",
        "https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?w=800",
    ],
    # 34. Greek Yogurt
    34: [
        "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800", # yogurt
        "https://images.unsplash.com/photo-1571212515416-fef01fc43637?w=800",
    ],
    # 35. Cheese Slices
    35: [
        "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=800", # cheese
        "https://images.unsplash.com/photo-1552767059-ce182ead6c1b?w=800",
    ],
    # 36. Rusks
    36: [
        "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800", # cookies/rusks
        "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=800",
    ],
    # 37. Dettol Soap
    37: [
        "https://images.unsplash.com/photo-1607006314571-008a38541a79?w=800", # bar soap
        "https://images.unsplash.com/photo-1600857062241-99e5da7f519f?w=800",
    ],
    # 38. Dove Shampoo
    38: [
        "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=800", # shampoo bottle
        "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=800",
    ],
    # 39. Colgate Toothpaste
    39: [
        "https://images.unsplash.com/photo-1559591937-e62fb3d834b7?w=800", # toothpaste & brush
        "https://images.unsplash.com/photo-1559591410-60b5030f230d?w=800",
        "https://images.unsplash.com/photo-1570554886111-e80fcca6a029?w=800",
    ],
    # 40. Nivea Cream
    40: [
        "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800", # cream jar
        "https://images.unsplash.com/photo-1608248597359-52e69738c8a1?w=800",
    ],
    # 41. Hand Wash
    41: [
        "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800", # hand wash dispenser
        "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800",
    ],
    # 42. Aloe Vera Gel
    42: [
        "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800", # aloe vera
        "https://images.unsplash.com/photo-1567928815104-b6378413da66?w=800",
    ],
    # 43. Vim Liquid
    43: [
        "https://images.unsplash.com/photo-1585421514738-01798e348b17?w=800", # dish wash / soap
        "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=800",
    ],
    # 44. Surf Excel
    44: [
        "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800", # laundry detergent / wash
        "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=800",
    ],
    # 45. Harpic Cleaner
    45: [
        "https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?w=800", # toilet cleaner / cleaning bottle
        "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800",
    ],
    # 46. Garbage Bags
    46: [
        "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800", # roll of bags
        "https://images.unsplash.com/photo-1518133835878-5a93cc3f89e5?w=800",
    ],
    # 47. Matchboxes
    47: [
        "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=800", # matches
        "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800",
    ],
    # 48. Floor Cleaner
    48: [
        "https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?w=800", # cleaner spray / bottle
        "https://images.unsplash.com/photo-1585421514738-01798e348b17?w=800",
    ],
}

print("Testing candidates...")
results = {}
for pid, urls in candidates.items():
    found = None
    for u in urls:
        req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
        try:
            res = urllib.request.urlopen(req, timeout=3)
            if res.status == 200:
                found = u
                break
        except Exception:
            continue
    if found:
        results[pid] = found
        print(f"OK: Product {pid} -> {found}")
    else:
        print(f"MISSING: Product {pid}")

print(f"\nTotal verified: {len(results)} / {len(candidates)}")
with open("backend/scratch/verified_images.json", "w") as f:
    json.dump(results, f, indent=2)
