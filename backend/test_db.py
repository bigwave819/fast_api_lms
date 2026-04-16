import asyncio
import sys
from core.database import engine

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

async def test():
    print("Testing connection...")
    try:
        async with engine.begin() as conn:
            print("CONNECTED")
    except Exception as e:
        print(f"FAILED: {e}")

asyncio.run(test())
