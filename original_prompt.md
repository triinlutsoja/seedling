This was the original first prompt I gave to Claude Code. I am only saving this for historical purposes. This is not a final blueprint for the project. Over time needs might evolve and this document can become outdated. Don't rely on the instructions given here.

# The initial original prompt
I want to build a PWA (Progressive Web App) garden planning app for my iPhone that helps me track plants, plan seasons, and remember what I did in previous years.                                                                 
  
## Tech Stack                                                                      
                                                                                
React with Vite                                                                 
Tailwind CSS for styling                                                        
Dexie.js for local storage (IndexedDB)                                          
Vite PWA Plugin for PWA features                                                
date-fns for date handling                                                      
React Router for navigation                                                     
React Notification API for phone notifications                                  
                                                                                
## App Structure                                                                   

Bottom Navigation (3 tabs)                                                      
                                                                                
1. My Garden - Shows all plants (active/archived toggle at top, search bar, "Add New Plant" button)                                                         
2. Calendars - Two calendar views: Sowing Calendar & Harvest Calendar (visual monthly displays showing only active plants)                                    
3. To-Do - Shows all reminders in chronological order (list view and calendar view)                                                                           
                                                                                
## Plant Profile Page                                                              

Each plant has:                                                                 
                                                                                
- Photo gallery (tap main photo to open full gallery, photos in chronological order newest first)                                                             
- Edit button (can edit all content: name, info, instructions, diary,             reminders)                                                                      
- Archive/Unarchive button                                                        
- Status: Active or Archived                                                      
- General Info section: annual/biennial/perennial, sowing period, harvest period, frost tolerance                                                         
- Growing Instructions section (free text)                                        
- Diary section (grouped by year, filterable by care stage OR keyword search)     
- Upcoming reminders for this plant                                               
                                                                                
## Diary Entries                                                                   
Each entry can have:                                                            
                                                                                
- Date (required)                                                                 
- Care stage (optional, from predefined list below)                               
- Note text (optional)                                                            
- Photos (optional, can attach multiple, can use camera directly)                 
                                                                                
### Care stage options:                                                             
                                                                                
- Sowed/Started Seeds                                                             
- Transplanted/Repotted                                                           
- Planted                                                                         
- Watered                                                                         
- Fertilized                                                                      
- Pruned/Trimmed                                                                  
- Treated (pests/disease)                                                         
- Harvested                                                                       
- Seeds Collected                                                                 
- (If no stage selected, it's a general note)                                     
                                                                                
## Reminders                                                                       
                                                                                
- Created on a plant's profile page                                               
- Must specify: date, description                                                 
- Appears in that plant's diary as "upcoming reminder"                            
- Appears in general To-Do section (chronologically sorted, nearest first)        
- Sends phone notification on the date                                            
- Notification has "remind me tomorrow" snooze option                             
- Stays in To-Do until marked complete                                            
- Tied to one specific plant                                                      
                                                                                
## Calendars                                                                       
- Sowing Calendar: Visual monthly view (Jan-Dec) showing when to sow each active plant. Example: "Tomatoes" with May-June highlighted/colored.            
- Harvest Calendar: Visual monthly view (Jan-Dec) showing harvest periods for each active plant. Example: "Tomatoes" with July-September highlighted/colored.                                                            

Both calendars only show plants currently marked as "Active" (not     archived).                                                                      

## Search & Filter                                                                 
                                                                                
My Garden has search bar that searches both active and archived plants.         
Plant diary has filters: by care stage (multi-select) OR keyword search         
                                                                                
### Key Behaviors                                                                   
                                                                                
- One plant profile can span multiple years (e.g., "Tomatoes" profile contains diary from 2024, 2025, 2026)                                           
- Diary entries grouped by year within profile                                    
- Multiple plants of same type need separate profiles (e.g., "Cherry Tomatoes" vs "Beefsteak Tomatoes")                                              
- App should work well on iPhone 13 Pro                                           
- Camera should be accessible directly for taking photos                          
- All data stored locally (no backend needed)                                     
                                                                                
## Initial State                                                                   
                                                                                
App starts empty, no onboarding flow.                                            
User manually adds first plants                                                 
                                                                                
Please set up the project structure, install all dependencies, and create       
the basic app shell with navigation working. Make it mobile-responsive and      
optimized for iPhone. Let me know when you're ready for me to test it.