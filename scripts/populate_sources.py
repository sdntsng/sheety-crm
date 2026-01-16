from src.auth import authenticate
from src.sheets import SheetManager
import typer
import time

def main():
    gc, _ = authenticate("default")
    manager = SheetManager(gc)
    sheet_name = "16lekpuWvgcQc9uFcGJn5slPYmKBTlC328ixUBUcGF8g"
    worksheet_name = "Sheet1"
    
    # DEFINING THE MASSIVE LIST (Targeting 100+ items)
    # Schema: [Category, Element, JSON, Description, Current/LongTerm, DB, Source, Perms, Notes]
    
    elements = []

    # 1. VISUAL IDENTITY
    cat = "Visual Identity"
    elements.extend([
        [cat, "Primary Logo", "{ url: str, aspect: float }", "Main vector logo file link.", "Long-term", "Yes", "Brand Website / Assets Portal", "Auth Required", "SVG preferred"],
        [cat, "Secondary Logo", "{ url: str }", "Stacked or alternative layout logo.", "Long-term", "Yes", "Brand Website / Assets Portal", "Auth Required", ""],
        [cat, "Favicon", "{ url: str }", "32x32 browser icon.", "Long-term", "Yes", "Brand Website (Root)", "Public", ""],
        [cat, "Logo Safe Space", "{ padding_px: int }", "Minimum clear space around logo.", "Long-term", "Yes", "Brand Guidelines PDF", "Internal", "Extracted from PDF"],
        [cat, "Primary Color", "{ hex: str, pantone: str }", "Core brand color.", "Long-term", "Yes", "Brand Website (CSS)", "Public", ""],
        [cat, "Secondary Color", "{ hex: str }", "Supporting brand color.", "Long-term", "Yes", "Brand Website (CSS)", "Public", ""],
        [cat, "Accent Color", "{ hex: str }", "Call-to-action color.", "Long-term", "Yes", "Brand Website (CSS)", "Public", ""],
        [cat, "Background Color", "{ hex: str, dark_mode: str }", "UI background token.", "Long-term", "Yes", "Brand Website (CSS)", "Public", ""],
        [cat, "Text Color", "{ hex: str }", "Primary body text color.", "Long-term", "Yes", "Brand Website (CSS)", "Public", ""],
        [cat, "Gradient Primary", "{ css: str }", "Main brand gradient definition.", "Long-term", "Yes", "Brand Website (CSS)", "Public", ""],
        [cat, "Display Font", "{ family: str, weights: [] }", "Headline typography family.", "Long-term", "Yes", "Brand Website (CSS)", "Public", ""],
        [cat, "Body Font", "{ family: str, weights: [] }", "Readable text typography.", "Long-term", "Yes", "Brand Website (CSS)", "Public", ""],
        [cat, "Corner Radius", "{ px: int }", "UI element roundness token.", "Long-term", "Yes", "Brand Website (CSS)", "Public", ""],
        [cat, "Icon Style", "{ type: 'outline'|'filled' }", "Iconography consistency rule.", "Long-term", "Yes", "Brand Website / App", "Internal", ""],
        [cat, "Button Style", "{ css: str }", "Primary button appearance.", "Long-term", "Yes", "Brand Website (CSS)", "Public", ""],
        [cat, "Shadow Depth", "{ css: str }", "Elevation shadow style.", "Long-term", "Yes", "Brand Website (CSS)", "Public", ""],
    ])

    # 2. BRAND STRATEGY
    cat = "Brand Strategy"
    elements.extend([
        [cat, "Tone Keywords", "[ 'friendly', 'expert' ]", "Adjectives defining brand voice.", "Long-term", "Yes", "Brand Guidelines PDF", "Internal", "LLM Extracted"],
        [cat, "Forbidden Words", "[ 'cheap', 'best' ]", "Blocklist of off-brand terms.", "Long-term", "Yes", "Brand Guidelines PDF", "Internal", ""],
        [cat, "Mission Statement", "{ text: str }", "Core company purpose.", "Long-term", "Yes", "Brand Website (About Us)", "Public", ""],
        [cat, "Tagline", "{ text: str }", "Primary marketing slogan.", "Long-term", "Yes", "Brand Website (Home)", "Public", ""],
        [cat, "Values Pillars", "[ 'sustainability', 'speed' ]", "Core operating principles.", "Long-term", "Yes", "Brand Guidelines PDF", "Internal", ""],
        [cat, "Reading Level", "{ grade: int }", "Target Flesch-Kincaid score.", "Long-term", "Yes", "Brand Blog", "Internal", "Computed from last 10 posts"],
        [cat, "Emoji Policy", "{ allowed: bool, blocklist: [] }", "Rules for emoji usage.", "Long-term", "Yes", "Social Media Guidelines", "Internal", ""],
        [cat, "Casing Style", "{ type: 'Sentence case' }", "Headline capitalization rule.", "Long-term", "Yes", "Brand Blog / Website", "Internal", ""],
        [cat, "Grammar Voice", "{ type: 'Active'|'Passive' }", "Preference for active voice.", "Long-term", "Yes", "Brand Copy", "Internal", ""],
    ])

    # 3. VISUAL INTELLIGENCE
    cat = "Visual Intelligence"
    elements.extend([
        [cat, "Visual Embeddings", "[ vector_float ]", "CLIP vector mean of brand visuals.", "Current", "Yes", "Instagram / Pinterest Profile", "Internal", "Core for generative AI"],
        [cat, "Dominant Texture", "{ label: str, confidence: float }", "Detected surface (e.g., 'matte', 'grain').", "Current", "Yes", "Brand Website / Instagram", "Internal", "Heuritech/YOLO"],
        [cat, "Lighting Model", "{ type: 'soft', direction: 'left' }", "Common lighting pattern in photography.", "Current", "Yes", "Brand Website / Instagram", "Internal", ""],
        [cat, "Composition Rule", "{ rule: 'thirds'|'center' }", "Preferred framing of subjects.", "Current", "Yes", "Brand Website / Instagram", "Internal", ""],
        [cat, "Subject Density", "{ score: 0.0-1.0 }", "How crowded images are (Minimal vs Busy).", "Current", "Yes", "Brand Website / Instagram", "Internal", ""],
        [cat, "Color Variance", "{ score: float }", "Vibrancy/saturation range.", "Current", "Yes", "Brand Website / Instagram", "Internal", ""],
        [cat, "Face Presence", "{ percentage: float }", "% of images containing human faces.", "Current", "Yes", "Instagram Profile", "Internal", ""],
        [cat, "Object Detection", "[ { label: str, freq: float } ]", "Top objects (e.g. 'Plants', 'Laptops').", "Current", "Yes", "Instagram Profile", "Internal", ""],
        [cat, "Filter Signature", "{ preset: str }", "Detected recurring filter/LUT.", "Current", "Yes", "Instagram Profile", "Internal", ""],
        [cat, "Motion Velocity", "{ score: float }", "Avg speed of motion in video assets.", "Current", "Yes", "TikTok / Reels", "Internal", ""],
        [cat, "Cut Rate", "{ cuts_per_min: float }", "Pacing of video content.", "Current", "Yes", "TikTok / Reels", "Internal", ""],
        [cat, "Audio Vibe", "{ label: str }", "Mood of background tracks (e.g. 'Lo-fi').", "Current", "Yes", "TikTok / Reels", "Internal", ""],
        [cat, "Text-to-Image Ratio", "{ ratio: float }", "Balance of text overlays vs imagery.", "Current", "Yes", "Instagram Stories / Pinterest", "Internal", ""],
        [cat, "Visual Saturation", "{ score: 0-1 }", "How common the brand's visual code is in the market.", "Long-term", "Yes", "Pinterest Category Search", "Internal", ""],
    ])

    # 4. TREND INTELLIGENCE (Outside-In)
    cat = "Trend Intelligence"
    elements.extend([
        [cat, "Rising Aesthetic", "{ name: str, velocity: int }", "Fast-growing design trend (e.g. 'Solar Punk').", "Current", "Yes", "Pinterest Trends / TikTok", "Auth Required", ""],
        [cat, "Declining Aesthetic", "{ name: str }", "Trends to avoid (e.g. 'Flat Design').", "Current", "Yes", "Pinterest Trends", "Auth Required", ""],
        [cat, "Trending Object", "{ label: str }", "Viral object (e.g. 'Stanley Cup').", "Current", "Yes", "TikTok Creative Center", "Scraping", ""],
        [cat, "Viral Format", "{ name: str }", "Current meme format (e.g. 'POV').", "Current", "Yes", "TikTok Creative Center", "Scraping", ""],
        [cat, "Hashtag Velocity", "{ tag: str, delta: float }", "Fastest growing related tag.", "Current", "Yes", "Instagram Explore / TikTok", "Auth Required", ""],
        [cat, "Keyword Gap", "[ str ]", "High volume keywords competitors rank for.", "Current", "Yes", "SEMrush / Ahrefs", "Auth Required", ""],
        [cat, "Seasonal Trigger", "{ event: str, date: str }", "Upcoming relevant cultural moment.", "Current", "Yes", "Google Calendar / Forekast", "Internal", ""],
        [cat, "Design Movement", "{ name: str }", "Macro design shift (e.g. 'Brutalism').", "Long-term", "Yes", "Dribbble / Behance Popular", "Scraping", ""],
        [cat, "Sentiment Trend", "{ slope: float }", "Direction of brand sentiment (Up/Down).", "Current", "Yes", "Twitter / Reddit", "Internal", ""],
    ])

    # 5. MARKET CONTEXT (Outside-In)
    cat = "Market Context"
    elements.extend([
        [cat, "Category Momentum", "{ growth: float }", "Overall interest growth of product category.", "Current", "Yes", "Google Trends (Web Search)", "Public", "Broad query (e.g. 'Energy Drink')"],
        [cat, "Competitor Launch", "{ product: str, date: str }", "Detection of new competitor SKU/Feature.", "Current", "Yes", "TechCrunch / Competitor Blog", "Scraping", ""],
        [cat, "Regulatory Risk", "{ risk_level: str }", "News regarding laws affecting category.", "Current", "Yes", "Google News (Legal)", "Public", ""],
        [cat, "Influencer Overlap", "{ handles: [] }", "Influencers mentioning Brand AND Competitors.", "Current", "Yes", "Instagram / TikTok Search", "Internal", ""],
        [cat, "Share of Shelf", "{ rank: int }", "Brand visibility ranking on retailer search.", "Current", "Yes", "Amazon / Sephora / Retailer", "Scraping", ""],
        [cat, "Share of Voice", "{ percentage: float }", "% of industry conversation owned.", "Current", "Yes", "Twitter / Reddit", "Internal", ""],
        [cat, "Engagement Rate", "{ percentage: float }", "Avg interactions per post.", "Current", "Yes", "Instagram Profile", "Auth Required", ""],
        [cat, "Audience Age", "{ min: int, max: int }", "Primary demographic bracket.", "Long-term", "Yes", "Instagram Insights", "Auth Required", ""],
        [cat, "Top Geo", "{ city: str }", "Primary audience location.", "Long-term", "Yes", "Google Analytics", "Auth Required", ""],
        [cat, "Competitor Price", "{ product: str, price: float }", "Benchmark product pricing.", "Current", "Yes", "Competitor Website", "Scraping", ""],
        [cat, "Competitor Promo", "{ text: str }", "Active competitor discount code.", "Current", "Yes", "Competitor Email / Banner", "Scraping", ""],
    ])

    # Locate rows
    data = manager.read_data(sheet_name)
    if not data:
        print("No data found")
        return

    print("Clearing sheet for mass population...")
    manager.clear_range(sheet_name, "A1:Z1000") # Brute force clear
    time.sleep(1) # Cooldown

    # Write Headers
    new_header = ["Category", "Atomic Elements", "JSON Format", "Description", "Current/ Long-Term", "DB", "Sources", "Permissions", "Notes"]
    manager.append_row(sheet_name, new_header)

    # 6. STRATEGIC INTELLIGENCE (Founders, Experts, Non-obvious)
    cat = "Strategic Intelligence"
    elements.extend([
        [cat, "Founder Activity", "{ handle: str, recent_topic: str }", "Recent posts by competitor founders.", "Current", "Yes", "LinkedIn / X (Twitter)", "Scraping", "Track thought leaderhsip"],
        [cat, "Expert Consensus", "{ topic: str, sentiment: float }", "Aggregated view from industry experts.", "Current", "Yes", "Substack / Medium / X", "Scraping", "Identify contrarian views"],
        [cat, "Industry Talk", "{ title: str, summary: str }", "Key learnings from recent TED/Conf talks.", "Long-term", "Yes", "TED / YouTube", "Scraping", "Transcript analysis"],
        [cat, "Tech Stack Signal", "{ tool: str, action: 'added'|'removed' }", "Competitor tech adoption (e.g. added Shopify).", "Current", "Yes", "BuiltWith / StackShare", "Scraping", "Signal of maturity/strategy"],
        [cat, "Hiring Velocity", "{ role: str, count: int }", "Competitor hiring surge in specific depts.", "Current", "Yes", "LinkedIn Jobs / Glassdoor", "Scraping", "Signal of expansion"],
        [cat, "Patent Filing", "{ title: str, date: str }", "New IP registrations.", "Long-term", "Yes", "Google Patents", "Public", "R&D signal"],
        [cat, "Ad Creative Fatigue", "{ days_active: int }", "How long competitor ads run before swap.", "Current", "Yes", "Meta Ad Library", "Scraping", "Signal of ad performance"],
        [cat, "Community Sentiment", "{ topic: str, emotion: str }", "Deep dive into Reddit/Discord niche communities.", "Current", "Yes", "Reddit / Discord", "Scraping", "Unfiltered customer voice"],
    ])

    # Locate rows
    data = manager.read_data(sheet_name)
    if not data:
        print("No data found")
        return

    print("Clearing sheet for mass population...")
    manager.clear_range(sheet_name, "A1:Z1000") # Brute force clear
    time.sleep(1) # Cooldown

    # Write Headers
    new_header = ["Category", "Atomic Elements", "JSON Format", "Description", "Current/ Long-Term", "DB", "Sources", "Permissions", "Notes"]
    manager.append_row(sheet_name, new_header)

    # Write All Elements in ONE Batch
    print(f"Bulk appending {len(elements)} rows...")
    manager.append_rows(sheet_name, elements)

if __name__ == "__main__":
    main()

if __name__ == "__main__":
    main()
