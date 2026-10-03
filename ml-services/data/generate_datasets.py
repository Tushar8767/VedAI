"""
Dataset Generator for Multilingual Emotion Model
Generates balanced training and evaluation datasets covering:
English, Hindi (Devanagari & Hinglish), Marathi (Devanagari & Marathinglish)
across 7 VedAI emotion categories.
"""

import json
import os

TRAIN_DATA = [
    # 1. stress_overwhelm
    {"text": "I am so overwhelmed by these continuous deadlines and exams.", "label": "stress_overwhelm", "lang": "en"},
    {"text": "Everything is piling up at work and I cannot catch my breath.", "label": "stress_overwhelm", "lang": "en"},
    {"text": "The pressure to perform is crushing me right now.", "label": "stress_overwhelm", "lang": "en"},
    {"text": "I have too much on my plate and feeling completely burned out.", "label": "stress_overwhelm", "lang": "en"},
    {"text": "im realy strest and bro I'm cooked from this workload", "label": "stress_overwhelm", "lang": "en_slang"},
    {"text": "मुझे काम का बहुत भारी तनाव महसूस हो रहा है और सिर घूम रहा है।", "label": "stress_overwhelm", "lang": "hi_deva"},
    {"text": "इम्तिहान के दबाव से मेरी नींद उड़ गई है, बहुत बोझ लग रहा है।", "label": "stress_overwhelm", "lang": "hi_deva"},
    {"text": "yaar mujhe exam ka bohot tension ho raha hai kuch samajh nahi aa raha", "label": "stress_overwhelm", "lang": "hinglish"},
    {"text": "bohot zyada pressure hai life mein, handle nahi ho pa raha", "label": "stress_overwhelm", "lang": "hinglish"},
    {"text": "office ka kaam khatam hi nahi hota, continuous burnout feel ho raha", "label": "stress_overwhelm", "lang": "hinglish"},
    {"text": "मला कामाचा प्रचंड ताण आला आहे आणि डोके सुन्न झाले आहे.", "label": "stress_overwhelm", "lang": "mr_deva"},
    {"text": "परीक्षेचा खूप जास्त दबाव जाणवत आहे, मला काही सुचत नाहीये.", "label": "stress_overwhelm", "lang": "mr_deva"},
    {"text": "mala khup tension aahe, kahi suchat nahi, khup thakloy", "label": "stress_overwhelm", "lang": "mr_roman"},
    {"text": "kamacha load khup jast vadhla aahe, damun gelo aaho", "label": "stress_overwhelm", "lang": "mr_roman"},
    {"text": "so much stress from morning till night, feeling utterly exhausted", "label": "stress_overwhelm", "lang": "en"},
    {"text": "जिम्मेदारी का इतना बोझ है कि सांस लेना मुश्किल हो गया है।", "label": "stress_overwhelm", "lang": "hi_deva"},
    {"text": "ek ke baad ek deadlines aa rahi hain, brain overload ho gaya", "label": "stress_overwhelm", "lang": "hinglish"},
    {"text": "कामाच्या ओझ्याखाली दबून गेलो आहे मी.", "label": "stress_overwhelm", "lang": "mr_deva"},
    {"text": "exhausted from running around all day trying to meet expectations", "label": "stress_overwhelm", "lang": "en"},
    {"text": "too many tasks at the same time, feeling totally swamped", "label": "stress_overwhelm", "lang": "en"},

    # 2. anxiety_fear
    {"text": "I am deeply scared about what will happen to my career in the future.", "label": "anxiety_fear", "lang": "en"},
    {"text": "A sudden wave of panic and nervous trembling hit me when I thought about it.", "label": "anxiety_fear", "lang": "en"},
    {"text": "I keep anticipating the worst possible outcome and dreading tomorrow.", "label": "anxiety_fear", "lang": "en"},
    {"text": "My chest feels tight with anxiety whenever I think about failing.", "label": "anxiety_fear", "lang": "en"},
    {"text": "मुझे भविष्य के बारे में सोचकर गहरा डर और घबराहट लग रही है।", "label": "anxiety_fear", "lang": "hi_deva"},
    {"text": "कहीं मैं असफल न हो जाऊं, यह चिंता मुझे बेचैन कर रही है।", "label": "anxiety_fear", "lang": "hi_deva"},
    {"text": "apne future ko lekar bohot dar lag raha hai, anxious ho raha hu", "label": "anxiety_fear", "lang": "hinglish"},
    {"text": "kahi sab bigad na jaye, dil ki dhadkan tez ho rahi hai nervousness se", "label": "anxiety_fear", "lang": "hinglish"},
    {"text": "mala khup bhiti vat-te... kahi suchat nahi", "label": "anxiety_fear", "lang": "mr_roman"},
    {"text": "भविष्यात काय होईल या भीतीने मन थरथर कापत आहे.", "label": "anxiety_fear", "lang": "mr_deva"},
    {"text": "अपयशाच्या भीतीने मला अस्वस्थ करून सोडले आहे.", "label": "anxiety_fear", "lang": "mr_deva"},
    {"text": "pudhcha vichar karun potat ghabharat vatatey", "label": "anxiety_fear", "lang": "mr_roman"},
    {"text": "I feel terrified of being judged by everyone in the room.", "label": "anxiety_fear", "lang": "en"},
    {"text": "man me anjaana sa dar baith gaya hai, anxiety attack jaisa lag raha", "label": "anxiety_fear", "lang": "hinglish"},
    {"text": "खूप भीती वाटते आहे की मी काही करू शकणार नाही.", "label": "anxiety_fear", "lang": "mr_deva"},
    {"text": "anxious restless thoughts won't let me sleep tonight", "label": "anxiety_fear", "lang": "en"},
    {"text": "dil me ghabrahat aur bechaini badhti ja rahi hai", "label": "anxiety_fear", "lang": "hinglish"},
    {"text": "भीतीने कंठ दाटून आला आहे आणि छाती धडधडत आहे.", "label": "anxiety_fear", "lang": "mr_deva"},
    {"text": "what if everything falls apart and I lose control?", "label": "anxiety_fear", "lang": "en"},
    {"text": "constant state of nervous alertness and dread", "label": "anxiety_fear", "lang": "en"},

    # 3. anger_frustration
    {"text": "I am furious that they broke their promise and disrespected my effort.", "label": "anger_frustration", "lang": "en"},
    {"text": "This situation is completely unfair and making my blood boil with rage.", "label": "anger_frustration", "lang": "en"},
    {"text": "I feel so irritated and angry with how people behave selfishly.", "label": "anger_frustration", "lang": "en"},
    {"text": "Unmet expectations are making me snappy and extremely frustrated.", "label": "anger_frustration", "lang": "en"},
    {"text": "मुझे इस अन्याय पर बहुत तेज गुस्सा और चिढ़ आ रही है।", "label": "anger_frustration", "lang": "hi_deva"},
    {"text": "लोगों के धोखेबाज़ रवैये से मेरा खून खौल रहा है, बहुत क्रोध में हूँ।", "label": "anger_frustration", "lang": "hi_deva"},
    {"text": "yaar mujhe itna gussa aa raha hai unke attitude par, completely frustrated", "label": "anger_frustration", "lang": "hinglish"},
    {"text": "dimag kharab ho gaya hai inki harkaton se, irritate ho gaya hu", "label": "anger_frustration", "lang": "hinglish"},
    {"text": "मला या वागण्याचा प्रचंड संताप आणि राग आला आहे.", "label": "anger_frustration", "lang": "mr_deva"},
    {"text": "त्यांच्या स्वार्थी वागण्याने डोक्यात तिडीक गेली आहे.", "label": "anger_frustration", "lang": "mr_deva"},
    {"text": "khup rag aala aahe mala, purna frustrate zalo aahe", "label": "anger_frustration", "lang": "mr_roman"},
    {"text": "sarvat kharab vatanan rag yetoy aani chidchid hote", "label": "anger_frustration", "lang": "mr_roman"},
    {"text": "I am so mad at myself for trusting them again.", "label": "anger_frustration", "lang": "en"},
    {"text": "itna krodh aa raha hai ki sab kuch todne ka man karta hai", "label": "anger_frustration", "lang": "hinglish"},
    {"text": "मला त्यांच्या अन्यायाविरुद्ध भयंकर चीड आली आहे.", "label": "anger_frustration", "lang": "mr_deva"},
    {"text": "boiling with irritation at these constant interruptions", "label": "anger_frustration", "lang": "en"},
    {"text": "bakwas system hai, frustrated with this total lack of accountability", "label": "anger_frustration", "lang": "hinglish"},
    {"text": "संतापाने हात थरथर कापत आहेत माझा राग अनावर होतोय.", "label": "anger_frustration", "lang": "mr_deva"},
    {"text": "sick and tired of being treated like a second-class citizen", "label": "anger_frustration", "lang": "en"},
    {"text": "seething with resentment over this betrayal", "label": "anger_frustration", "lang": "en"},

    # 4. sadness_grief
    {"text": "I feel deeply sad and an empty loneliness in my heart today.", "label": "sadness_grief", "lang": "en"},
    {"text": "The heartbreak of losing someone I loved leaves an aching grief.", "label": "sadness_grief", "lang": "en"},
    {"text": "I have been crying quietly because I feel so alone and sorrowful.", "label": "sadness_grief", "lang": "en"},
    {"text": "Feeling low, hopeless, and weighed down by emotional despair.", "label": "sadness_grief", "lang": "en"},
    {"text": "मन बहुत उदास है और आंखों से आंसू रुक नहीं रहे हैं।", "label": "sadness_grief", "lang": "hi_deva"},
    {"text": "गहरे दुःख और अकेलेपन ने मुझे भीतर से तोड़ दिया है।", "label": "sadness_grief", "lang": "hi_deva"},
    {"text": "bohot akela aur sad feel ho raha hai, dil tut gaya hai", "label": "sadness_grief", "lang": "hinglish"},
    {"text": "kisi se baat karne ka man nahi, emotional pain bardasht nahi hota", "label": "sadness_grief", "lang": "hinglish"},
    {"text": "हृदयात असह्य दुःख आणि पोकळी दाटून आली आहे.", "label": "sadness_grief", "lang": "mr_deva"},
    {"text": "मन फार खिन्न आणि उदास झाले आहे, रडू आवरत नाहीये.", "label": "sadness_grief", "lang": "mr_deva"},
    {"text": "khup dukha vatatey, aatun purna tutlo aahe", "label": "sadness_grief", "lang": "mr_roman"},
    {"text": "manat khup ghor udaasi aani eklepan aala aahe", "label": "sadness_grief", "lang": "mr_roman"},
    {"text": "An overwhelming ache of missing my home and old memories.", "label": "sadness_grief", "lang": "en"},
    {"text": "bahut dukh hai is dil mein, kisi ko dikha nahi sakte", "label": "sadness_grief", "lang": "hinglish"},
    {"text": "त्यांच्या आठवणीने डोळे भरून आले आहेत, मन शून्य झाले आहे.", "label": "sadness_grief", "lang": "mr_deva"},
    {"text": "heavy heart full of sorrow and unexpressed tears", "label": "sadness_grief", "lang": "en"},
    {"text": "rona aa raha hai baar baar, sadness khatam hi nahi hoti", "label": "sadness_grief", "lang": "hinglish"},
    {"text": "अतिशय दुःखी आहे मी, जगण्यात काही अर्थ उरला नाही असं वाटतं.", "label": "sadness_grief", "lang": "mr_deva"},
    {"text": "loneliness echoes in my chest throughout the evening", "label": "sadness_grief", "lang": "en"},
    {"text": "mourning the loss of what once brought so much joy", "label": "sadness_grief", "lang": "en"},

    # 5. calm_peace
    {"text": "I feel a serene sense of inner peace and quiet balance right now.", "label": "calm_peace", "lang": "en"},
    {"text": "Sitting in stillness, my mind feels clear, settled, and tranquil.", "label": "calm_peace", "lang": "en"},
    {"text": "Letting go of expectations has brought immense calmness to my soul.", "label": "calm_peace", "lang": "en"},
    {"text": "Deep breathing in nature made my whole body relaxed and at ease.", "label": "calm_peace", "lang": "en"},
    {"text": "मन बहुत शांत, स्थिर और आंतरिक संतोष से भरा हुआ है।", "label": "calm_peace", "lang": "hi_deva"},
    {"text": "ध्यान लगाने के बाद भीतर एक अद्भुत शांति और सुकून का अनुभव हो रहा है।", "label": "calm_peace", "lang": "hi_deva"},
    {"text": "ab man bilkul shant aur relaxed feel kar raha hai, zero tension", "label": "calm_peace", "lang": "hinglish"},
    {"text": "bohot sukoon hai is waqt, mind is calm and peaceful", "label": "calm_peace", "lang": "hinglish"},
    {"text": "माझे मन आता अत्यंत शांत, समाधानी आणि प्रसन्न आहे.", "label": "calm_peace", "lang": "mr_deva"},
    {"text": "ध्यानानंतर एक सुंदर आत्मिक शांतता आणि स्थिरता लाभली आहे.", "label": "calm_peace", "lang": "mr_deva"},
    {"text": "manat khup shantata aani prasannata vatat aahe", "label": "calm_peace", "lang": "mr_roman"},
    {"text": "aata purna shant vatatey, sarva thambla aahe", "label": "calm_peace", "lang": "mr_roman"},
    {"text": "A quiet contentment resting gently in the present moment.", "label": "calm_peace", "lang": "en"},
    {"text": "shanti aur thahrav mil gaya hai meditation ke baad", "label": "calm_peace", "lang": "hinglish"},
    {"text": "निसर्गाच्या सानिध्यात मन अगदी शांत आणि निवांत झाले आहे.", "label": "calm_peace", "lang": "mr_deva"},
    {"text": "unruffled like a still lake on a windless morning", "label": "calm_peace", "lang": "en"},
    {"text": "har cheez me sukoon mehsus ho raha hai aaj", "label": "calm_peace", "lang": "hinglish"},
    {"text": "चित्त स्थिर झाले आहे आणि अंतर्मनात शांतता पसरली आहे.", "label": "calm_peace", "lang": "mr_deva"},
    {"text": "pure ease and graceful acceptance of what is", "label": "calm_peace", "lang": "en"},
    {"text": "gentle rhythmic breathing bringing deep restoration", "label": "calm_peace", "lang": "en"},

    # 6. hope_optimism
    {"text": "I feel a renewed sense of hope and confidence about tomorrow.", "label": "hope_optimism", "lang": "en"},
    {"text": "Things are gradually improving, and I believe we will make it through.", "label": "hope_optimism", "lang": "en"},
    {"text": "Looking forward to this new chapter with enthusiasm and faith.", "label": "hope_optimism", "lang": "en"},
    {"text": "Every difficulty carries the seed of growth and positive change.", "label": "hope_optimism", "lang": "en"},
    {"text": "मुझे पूरा विश्वास है कि आने वाला कल सुखद और सकारात्मक होगा।", "label": "hope_optimism", "lang": "hi_deva"},
    {"text": "हौसला और आशा की नई किरण मुझे आगे बढ़ने की शक्ति दे रही है।", "label": "hope_optimism", "lang": "hi_deva"},
    {"text": "feeling positive and hopeful, sab achha hoga aage chalkar", "label": "hope_optimism", "lang": "hinglish"},
    {"text": "ek nayi ummeed jagi hai dil me, positive energy feel ho rahi", "label": "hope_optimism", "lang": "hinglish"},
    {"text": "उद्याचा दिवस नक्कीच चांगला असेल अशी मनामध्ये पक्की आशा आहे.", "label": "hope_optimism", "lang": "mr_deva"},
    {"text": "सकारात्मक ऊर्जेने मन भरून गेले आहे आणि आत्मविश्वास वाढला आहे.", "label": "hope_optimism", "lang": "mr_deva"},
    {"text": "ek navi asha aani vishwas manat nirman zala aahe", "label": "hope_optimism", "lang": "mr_roman"},
    {"text": "pudhche divas khup chhan asnar astat maza vishwas aahe", "label": "hope_optimism", "lang": "mr_roman"},
    {"text": "Stepping forward with courage and gratitude in my heart.", "label": "hope_optimism", "lang": "en"},
    {"text": "man me umeed aur vishwas hai ki hum jeetenge", "label": "hope_optimism", "lang": "hinglish"},
    {"text": "प्रयत्न चालू ठेवले तर नक्की यश मिळेल असा आशावाद वाटतो.", "label": "hope_optimism", "lang": "mr_deva"},
    {"text": "the light is breaking through the clouds with promise", "label": "hope_optimism", "lang": "en"},
    {"text": "positive vibes aur nayi shuruat ke liye ready hu", "label": "hope_optimism", "lang": "hinglish"},
    {"text": "नव्या संधींचे स्वागत करण्यासाठी मन सज्ज झाले आहे.", "label": "hope_optimism", "lang": "mr_deva"},
    {"text": "trusting in the unfolding journey with an open heart", "label": "hope_optimism", "lang": "en"},
    {"text": "optimistic about our shared progress and future possibilities", "label": "hope_optimism", "lang": "en"},

    # 7. neutral_unclear
    {"text": "I woke up at 7am today, had breakfast, and organized my desk.", "label": "neutral_unclear", "lang": "en"},
    {"text": "The weather forecast said it might rain later this afternoon.", "label": "neutral_unclear", "lang": "en"},
    {"text": "Reviewing notes from the meeting before heading over to the library.", "label": "neutral_unclear", "lang": "en"},
    {"text": "Not particularly happy or sad, just observing the day pass by.", "label": "neutral_unclear", "lang": "en"},
    {"text": "आज मैंने सामान्य दिनचर्या के अनुसार अपना काम पूरा किया।", "label": "neutral_unclear", "lang": "hi_deva"},
    {"text": "गाड़ी में पेट्रोल भरवाया और बाज़ार से कुछ जरूरी सामान खरीदा।", "label": "neutral_unclear", "lang": "hi_deva"},
    {"text": "bas normal routine chal raha hai, nothing special today", "label": "neutral_unclear", "lang": "hinglish"},
    {"text": "aaj subah utha, chai pi aur computer par baith gaya", "label": "neutral_unclear", "lang": "hinglish"},
    {"text": "आज नेहमीप्रमाणे सकाळची कामे आटोपली आणि वर्तमानपत्र वाचले.", "label": "neutral_unclear", "lang": "mr_deva"},
    {"text": "दुपारी थोडे काम केले आणि संध्याकाळी किराणा सामान आणले.", "label": "neutral_unclear", "lang": "mr_deva"},
    {"text": "fakt aapan aani apla kam, baki kahi vishesh nahi", "label": "neutral_unclear", "lang": "mr_roman"},
    {"text": "regular day hota aaj cha, kahi navin ghadla nahi", "label": "neutral_unclear", "lang": "mr_roman"},
    {"text": "Read two chapters of a history textbook this afternoon.", "label": "neutral_unclear", "lang": "en"},
    {"text": "office gaye the, wapas aa gaye normal time par", "label": "neutral_unclear", "lang": "hinglish"},
    {"text": "रोजच्याप्रमाणे गाडीची चावी जागेवर ठेवली.", "label": "neutral_unclear", "lang": "mr_deva"},
    {"text": "making a grocery list for the upcoming weekend", "label": "neutral_unclear", "lang": "en"},
    {"text": "kuch khas nahi, everyday life chal rahi hai", "label": "neutral_unclear", "lang": "hinglish"},
    {"text": "काही विशेष नाही, नेहमीसारखाच एक साधा दिवस होता.", "label": "neutral_unclear", "lang": "mr_deva"},
    {"text": "looking at the street outside the window quietly", "label": "neutral_unclear", "lang": "en"},
    {"text": "scheduled an appointment for next Tuesday at 3pm", "label": "neutral_unclear", "lang": "en"}
]

# Separate, Independent Held-Out Evaluation Dataset
EVAL_DATA = [
    # 1. stress_overwhelm
    {"text": "I feel like I'm drowning under these academic assignments.", "label": "stress_overwhelm", "lang": "en"},
    {"text": "it's too much pressure, I'm completely exhausted and drained.", "label": "stress_overwhelm", "lang": "en"},
    {"text": "तनाव इतना अधिक है कि मुझसे अब और काम नहीं हो पा रहा।", "label": "stress_overwhelm", "lang": "hi_deva"},
    {"text": "exam ki tayaari ka itna stress hai ki sar phat raha hai", "label": "stress_overwhelm", "lang": "hinglish"},
    {"text": "कामाच्या अतिताणाने मला प्रचंड थकवा आला आहे.", "label": "stress_overwhelm", "lang": "mr_deva"},
    {"text": "khup pressure aalay office madhe, kahi suchat nahiye", "label": "stress_overwhelm", "lang": "mr_roman"},

    # 2. anxiety_fear
    {"text": "I am so anxious about tomorrow's interview that I feel physically sick.", "label": "anxiety_fear", "lang": "en"},
    {"text": "What if they reject me? My mind cannot stop worrying about the worst.", "label": "anxiety_fear", "lang": "en"},
    {"text": "अज्ञात का भय मुझे भीतर तक डरा रहा है।", "label": "anxiety_fear", "lang": "hi_deva"},
    {"text": "result ko lekar bohot ghabrahat aur dar ho raha hai", "label": "anxiety_fear", "lang": "hinglish"},
    {"text": "परीक्षेच्या विचाराने मनात भयंकर धास्ती भरली आहे.", "label": "anxiety_fear", "lang": "mr_deva"},
    {"text": "mala future chi khup bhiti vatatey", "label": "anxiety_fear", "lang": "mr_roman"},

    # 3. anger_frustration
    {"text": "I am outraged by the arrogant way my manager spoke to me.", "label": "anger_frustration", "lang": "en"},
    {"text": "I want to scream because nothing is working the way it should.", "label": "anger_frustration", "lang": "en"},
    {"text": "उसकी इस हरकत पर मुझे भयंकर गुस्सा आ रहा है।", "label": "anger_frustration", "lang": "hi_deva"},
    {"text": "itna frustration ho raha hai is stupid policy se", "label": "anger_frustration", "lang": "hinglish"},
    {"text": "त्यांच्या उद्धटपणाने माझा संताप अनावर झाला आहे.", "label": "anger_frustration", "lang": "mr_deva"},
    {"text": "khup chid aliye mala tyachya bolnyacha", "label": "anger_frustration", "lang": "mr_roman"},

    # 4. sadness_grief
    {"text": "An empty sadness that won't lift, feeling utterly solitary.", "label": "sadness_grief", "lang": "en"},
    {"text": "I miss my mother so much today, the grief feels unbearable.", "label": "sadness_grief", "lang": "en"},
    {"text": "मन बहुत उदास है, सब कुछ सूना-सूना लग रहा है।", "label": "sadness_grief", "lang": "hi_deva"},
    {"text": "dil me bahut dukh aur emptiness hai aaj", "label": "sadness_grief", "lang": "hinglish"},
    {"text": "घरातील माणसाच्या विरहाने डोळ्यात सतत पाणी येत आहे.", "label": "sadness_grief", "lang": "mr_deva"},
    {"text": "khup ekla vatatay aani radu yetay", "label": "sadness_grief", "lang": "mr_roman"},

    # 5. calm_peace
    {"text": "Feeling very balanced, serene, and grounded in the quiet afternoon.", "label": "calm_peace", "lang": "en"},
    {"text": "A deep sense of stillness settled over my thoughts today.", "label": "calm_peace", "lang": "en"},
    {"text": "चारों तरफ शांति और मन में एक गहरा ठहराव है।", "label": "calm_peace", "lang": "hi_deva"},
    {"text": "bilkul sukoon hai, mind ekdum shant hai", "label": "calm_peace", "lang": "hinglish"},
    {"text": "मनावरचा सर्व ताण निघून गेला असून शांतता जाणवत आहे.", "label": "calm_peace", "lang": "mr_deva"},
    {"text": "man ekdum cool aani prasanna vatatey", "label": "calm_peace", "lang": "mr_roman"},

    # 6. hope_optimism
    {"text": "I genuinely feel that things will turn around and brighten up soon.", "label": "hope_optimism", "lang": "en"},
    {"text": "Full of positive anticipation for the opportunities ahead.", "label": "hope_optimism", "lang": "en"},
    {"text": "उम्मीद की किरण दिख रही है, सब ठीक हो जाएगा।", "label": "hope_optimism", "lang": "hi_deva"},
    {"text": "positive vibes hain, aane wala waqt behtar hoga", "label": "hope_optimism", "lang": "hinglish"},
    {"text": "नव्या दिवसात नक्की काहीतरी चांगले घडेल असा ठाम विश्वास आहे.", "label": "hope_optimism", "lang": "mr_deva"},
    {"text": "sagla changla hoil asa vishwas vatat aahe", "label": "hope_optimism", "lang": "mr_roman"},

    # 7. neutral_unclear
    {"text": "I bought some coffee beans from the grocery store this morning.", "label": "neutral_unclear", "lang": "en"},
    {"text": "The train arrived on platform three at ten minutes past two.", "label": "neutral_unclear", "lang": "en"},
    {"text": "आज दोपहर को मैंने पुरानी फाइलें व्यवस्थित कीं।", "label": "neutral_unclear", "lang": "hi_deva"},
    {"text": "normal din tha, shaam ko walk pe gaye the", "label": "neutral_unclear", "lang": "hinglish"},
    {"text": "आज बाजारातून भाजीपाला आणला आणि वर्तमानपत्र वाचले.", "label": "neutral_unclear", "lang": "mr_deva"},
    {"text": "fakt aapan aani apla dinakram hota", "label": "neutral_unclear", "lang": "mr_roman"}
]

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.abspath(__file__))
    train_path = os.path.join(base_dir, "train_dataset.json")
    eval_path = os.path.join(base_dir, "eval_dataset.json")

    with open(train_path, "w", encoding="utf-8") as f:
        json.dump(TRAIN_DATA, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(TRAIN_DATA)} training samples to {train_path}")

    with open(eval_path, "w", encoding="utf-8") as f:
        json.dump(EVAL_DATA, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(EVAL_DATA)} evaluation samples to {eval_path}")
