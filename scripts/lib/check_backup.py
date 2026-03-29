import json
import os

with open('apps/web/lib/data/cards.catalog.backup.json') as f:
    backup = json.load(f)

with open('apps/web/lib/data/cards.json') as f:
    current = json.load(f)

real_backup = [c for c in backup if c.get('imageUrl') and 'placehold' not in c.get('imageUrl','')]
placeholder_backup = [c for c in backup if not c.get('imageUrl') or 'placehold' in c.get('imageUrl','')]
print(f"Backup: {len(backup)} cards | {len(real_backup)} real images | {len(placeholder_backup)} placeholder/missing")
if real_backup:
    print(f"  Sample real URL: {real_backup[0]['imageUrl']}")

real_current = [c for c in current if c.get('imageUrl') and 'placehold' not in c.get('imageUrl','')]
print(f"Current: {len(current)} cards | {len(real_current)} real images")

# Sets in backup but not in current
current_ids = {c['id'] for c in current}
missing_from_current = [c for c in backup if c['id'] not in current_ids]
print(f"\nCards in backup but NOT in current: {len(missing_from_current)}")
sets_missing = {}
for c in missing_from_current:
    s = c.get('set','?')
    sets_missing[s] = sets_missing.get(s,0) + 1
for s,n in sorted(sets_missing.items()):
    print(f"  {s}: {n}")
