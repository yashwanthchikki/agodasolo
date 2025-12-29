import pandas as pd
import streamlit as st
from PIL import Image
import numpy as np
import copy 
# --- Imports for Visualization Section 
import matplotlib.pyplot as plt
import plotly.express as px
from sklearn.linear_model import LinearRegression

st.set_page_config(layout="wide")

# --- Load data -----------------------------------------------------------------------------------------
try:
    df = pd.read_excel('data.xlsx')
except FileNotFoundError:
    st.error("Error: 'data.xlsx' not found. Please ensure the data file is in the same directory.")
    st.stop()
except Exception as e:
    st.error(f"Error loading data: {e}")
    st.stop()

# --- header section -------------------------------------------------------------------------------------
header_container = st.container()
with header_container:
    col_title, col_logo = st.columns([0.7, 0.3])

    # Left Column: Title
    col_title.markdown("<h1 style='color: #4CAF50; margin-bottom: 0px;'>NetBenefits Page Prioritization</h1>", unsafe_allow_html=True)
    col_title.markdown("App Page Prioritization Engine", unsafe_allow_html=True)

    # Right Column: Logo
    try:
        image = Image.open("logo.png")
        resized_image = image.resize((500, 100)) 
        col_logo.image(resized_image, use_container_width=True) 
    except FileNotFoundError:
        col_logo.warning("Logo not found. Header is title-only.")
    except Exception as e:
        col_logo.warning(f"Could not load/resize logo: {e}")
    
    st.markdown("<hr style='border: 4px solid #4CAF50;'>", unsafe_allow_html=True) 

# --- body------------------------------------------------------------------------------------------------- ---
BASE_CONFIG = {
    "pg_visitors": [3], "friction_calls_weight": [3], "aht_weight": [3],
    "desktop_switch_rate_weight": [3], "pg_visits": [3], "visits_per_visitor_weight": [3],
    "call_rate_weight": [3], "ease_of_use_weight": [3], "cei_top2box_weight": [3],
    "friction_desktop_7day_weight": [3]
}

CONFIGURATIONS = {
    "Balanced": copy.deepcopy(BASE_CONFIG),
    "Friction Focused": {
        **copy.deepcopy(BASE_CONFIG), 
        "pg_visitors": [1], "friction_calls_weight": [5], "aht_weight": [4],
        "call_rate_weight": [5], "friction_desktop_7day_weight": [5]
    },
    "Engagement Heavy": {
        **copy.deepcopy(BASE_CONFIG),
        "pg_visitors": [4], "pg_visits": [5], "visits_per_visitor_weight": [4],
        "friction_calls_weight": [2], "aht_weight": [1], "call_rate_weight": [1]
    }
}

# --- Define hierarchical groups (Mapping: Session Key -> Friendly Label) ---
feature_groups = {
    "Volume & Engagement": {
        "pg_visitors": "VISITORS",
        "pg_visits": "VISITS",
        "visits_per_visitor_weight": "Visits_per_Visitor"
    },
    "Satisfaction & CX": { 
        "cei_top2box_weight": "CEI - Top2Box",
        "ease_of_use_weight": "Ease of Use - Top2Box"
    },
    "Calls ": {
        "friction_calls_weight": "Friction - # Calls (7 days)",
        "aht_weight": "Avg. AHT per call",
        "call_rate_weight": "Call Rate (3rd friction metric)"
    },
    "Desktop Switch ": {
        "desktop_switch_rate_weight": "Desktop Switch Rate",
        "friction_desktop_7day_weight": "Desktop Switch (7 days)"
    }
}

# --- Initialize session state for multiple profiles ---
if "weight_profiles" not in st.session_state:
    st.session_state.weight_profiles = []

# Initialize with one Balanced profile if empty
if not st.session_state.weight_profiles:
    st.session_state.weight_profiles.append({
        "name": "Profile 1 (Balanced)",
        **CONFIGURATIONS["Balanced"]
    })

# --- all necasssary function ------------------------------------------------------------------------------------

def add_profile():
    new_index = len(st.session_state.weight_profiles) + 1
    new_profile = {
        "name": f"Profile {new_index} (Balanced)",
        **CONFIGURATIONS["Balanced"]
    }
    st.session_state.weight_profiles.append(new_profile)

def remove_profile(index_to_remove):
    """Removes a weight profile by index."""
    if len(st.session_state.weight_profiles) > 1:
        st.session_state.weight_profiles.pop(index_to_remove)
    else:
        st.error("Cannot remove the last profile.")

def update_profile_weight(profile_index, key, new_value):
    """Updates the weight (which is a list) for a specific profile and key."""
    # Ensure the value is stored as an array [value]
    st.session_state.weight_profiles[profile_index][key] = [new_value]
    
# --- Slider Rendering Function ---

def render_sliders(profile_index, column_container):
    """
    Renders the weight sliders (0-5 scale) for a specific profile index in a 1x4 layout.
    """
    profile = st.session_state.weight_profiles[profile_index]
    
    slider_key_prefix = f'slider_temp_{profile_index}'

    # The on_change callback needs to know the profile index and the key to update
    def slider_callback(k):
        new_val = st.session_state[f'{slider_key_prefix}_{k}']
        update_profile_weight(profile_index, k, new_val)

    # 1. Profile Name/Preset Selector
    col_name, col_preset = column_container.columns([0.6, 0.4])
    
    new_name = col_name.text_input("Profile Name", profile["name"], key=f"name_{profile_index}")
    st.session_state.weight_profiles[profile_index]["name"] = new_name
    
    # Identify current preset selection to manage changes
    current_preset_name = st.session_state.get(f"last_preset_{profile_index}", "Balanced")
    
    # Find the index of the currently selected preset for the selectbox default
    preset_options = list(CONFIGURATIONS.keys())
    try:
        default_index = preset_options.index(current_preset_name)
    except ValueError:
        default_index = 0 # Default to Balanced if not found

    selected_preset = col_preset.selectbox(
        "Apply Preset", 
        preset_options,
        index=default_index,
        key=f"preset_{profile_index}"
    )
    
    # Check if user changed preset
    if current_preset_name != selected_preset:
        st.session_state[f"last_preset_{profile_index}"] = selected_preset
        
        # Deep copy the weights from the new preset configuration
        new_weights = copy.deepcopy(CONFIGURATIONS[selected_preset])
        for key, value in new_weights.items():
             # Update the specific profile's weights
             st.session_state.weight_profiles[profile_index][key] = value
        st.rerun() 

    # 2. 1x4 Slider Layout
    weight_col_1, weight_col_2, weight_col_3, weight_col_4 = column_container.columns(4) 
    
    group_names = list(feature_groups.keys())
    column_maps = {
        weight_col_1: [group_names[0]], 
        weight_col_2: [group_names[2]], 
        weight_col_3: [group_names[1]], 
        weight_col_4: [group_names[3]]  
    }
    for column, groups in column_maps.items():
        with column:
            for group_name in groups:
                st.markdown(f"**<div style='font-size: 16px; margin-bottom: 5px; color: #4CAF50;'>{group_name}</div>**", unsafe_allow_html=True) 
                with st.container(border=True): 
                    for key, label in feature_groups[group_name].items():
                        # Read the first element of the weight array for the current value
                        current_value = profile.get(key, [3])[0]
                        
                        st.slider(
                            label,0,5, current_value, key=f'{slider_key_prefix}_{key}', on_change=slider_callback, args=(key,), label_visibility="visible")
                        


# --- Calculation Helper Functions ---

def normalize(series):
    """Normalizes a pandas Series to a 0-1 range."""
    if series.empty or series.max() == series.min():
        return pd.Series(0, index=series.index)
    return (series - series.min()) / (series.max() - series.min())

def normalize_weights(weights_dict):
    """Normalize user-set weights (0-5 scale) to a 0-1 range."""
    weight_keys = list(BASE_CONFIG.keys())
    values = [weights_dict.get(k, [3])[0] for k in weight_keys] 
    
    min_val = min(values)
    max_val = max(values)
    
    if max_val == min_val:
        # If all weights are the same (e.g., all 0s or all 3s), treat them as having equal influence
        return {k: 1.0 for k in weight_keys} 
    
    normalized = {}
    for k in weight_keys:
        v_int = weights_dict.get(k, [3])[0]
        normalized[k] = (v_int - min_val) / (max_val - min_val)

    return normalized

def calculate_priority_df(df_input, weight_profile):
    working_df = df_input.copy()
    
    # 1. Normalization (Data-based, applied to the working copy)
    working_df['Visitors'] = normalize(working_df['VISITORS'])
    working_df['Visits'] = normalize(working_df['VISITS'])
    working_df['Visits_per_Visitor'] = normalize(working_df['Visits_per_Visitor'])
    working_df['Friction - # Calls within 7 days'] = normalize(working_df['PG Friction - # Calls within 7 days'])
    working_df['Avg. AHT per call'] = normalize(working_df['Avg. AHT per call'])
    working_df['Desktop Switch Rate'] = normalize(working_df['Desktop Switch Rate'])
    working_df['Switch to Desktop within 7 days'] = normalize(working_df['PG Friction - Switch to Desktop within 7 days'])
    working_df['Call Rate Normalized'] = normalize(working_df['Call Rate'])
    working_df['CEI - Top2Box Normalized'] = normalize(100 - working_df['CEI - Top2Box'])
    working_df['Ease of Use - Top2Box Normalized'] = normalize(100 - working_df['Ease of Use - Top2Box'])
    
    # 2. Weight Normalization (Profile-based)
    normalized_weights = normalize_weights(weight_profile)
    
    # 3. Raw Priority Calculation
    working_df['RawPriority'] = (
        working_df['Visitors'] * normalized_weights['pg_visitors'] +
        working_df['Visits'] * normalized_weights['pg_visits'] +
        working_df['Visits_per_Visitor'] * normalized_weights['visits_per_visitor_weight'] +
        working_df['Friction - # Calls within 7 days'] * normalized_weights['friction_calls_weight'] +
        working_df['Avg. AHT per call'] * normalized_weights['aht_weight'] +
        working_df['Call Rate Normalized'] * normalized_weights['call_rate_weight'] + 
        working_df['Desktop Switch Rate'] * normalized_weights['desktop_switch_rate_weight'] +
        working_df['Switch to Desktop within 7 days'] * normalized_weights['friction_desktop_7day_weight'] +
        working_df['Ease of Use - Top2Box Normalized'] * normalized_weights['ease_of_use_weight'] +
        working_df['CEI - Top2Box Normalized'] * normalized_weights['cei_top2box_weight']
    )
    
    # 4. Sort and return results
    working_df = working_df.sort_values(by='RawPriority', ascending=False)
    
    return working_df

def display_priority_results(working_df, weight_profile):
    """Displays the full results table for a single profile."""
    
    feature_map = {
        'VISITORS': ('Visitors', 'pg_visitors'),
        'VISITS': ('Visits', 'pg_visits'),
        'Visits_per_Visitor': ('Visits_per_Visitor', 'visits_per_visitor_weight'),
        'PG Friction - # Calls within 7 days': ('Friction - # Calls within 7 days', 'friction_calls_weight'),
        'Avg. AHT per call': ('Avg. AHT per call', 'aht_weight'),
        'Call Rate': ('Call Rate Normalized', 'call_rate_weight'),
        'Desktop Switch Rate': ('Desktop Switch Rate', 'desktop_switch_rate_weight'),
        'PG Friction - Switch to Desktop within 7 days': ('Switch to Desktop within 7 days', 'friction_desktop_7day_weight'),
        'Ease of Use - Top2Box': ('Ease of Use - Top2Box Normalized', 'ease_of_use_weight'),
        'CEI - Top2Box': ('CEI - Top2Box Normalized', 'cei_top2box_weight') 
    }
    
    output_columns = ['PAGE_GROUP']
    output_columns.extend(feature_map.keys())
    output_columns.append('RawPriority')

    st.subheader(f' {weight_profile["name"]} - Prioritized Pages (Ranked by RawPriority Score)')
    st.dataframe(working_df[output_columns].reset_index(drop=True), use_container_width=True)

# --- Comparison Function ---
def display_comparison(df_input, profiles):
    """
    Calculates and displays a comparison table of RawPriority scores across all profiles.
    """
    st.markdown("---")
    st.header("Comparison Mode: Profile Prioritization Overview")
    
    if not profiles:
        st.info("No profiles available for comparison. Please add at least one profile.")
        return

    comparison_df = None
    
    for profile in profiles:
        # Calculate the prioritized DataFrame using the new helper function
        working_df = calculate_priority_df(df_input, profile) 
        
        # Select only PAGE_GROUP and RawPriority, and rename the priority column
        priority_col_name = f"{profile['name']} (RawPriority)"
        # Round the priority score for display clarity
        profile_results = working_df[['PAGE_GROUP', 'RawPriority']].copy()
        profile_results['RawPriority'] = profile_results['RawPriority'].round(4)
        profile_results = profile_results.rename(columns={'RawPriority': priority_col_name})
        
        # Merge results into the comparison DataFrame
        if comparison_df is None:
            comparison_df = profile_results
        else:
            # Merge on PAGE_GROUP
            comparison_df = pd.merge(comparison_df, profile_results, on='PAGE_GROUP', how='outer')
            
    if comparison_df is not None:
        # Get the names of the priority score columns
        score_columns = [col for col in comparison_df.columns if 'RawPriority' in col]
        
        # Calculate a combined score for sorting the comparison table (Average Priority)
        comparison_df['Average Priority Score'] = comparison_df[score_columns].mean(axis=1)
        
        # Display the final comparison table, sorted by the average priority score
        comparison_df = comparison_df.sort_values(by='Average Priority Score', ascending=False)
        
        # Drop the temporary sorting column before displaying
        comparison_df = comparison_df.drop(columns=['Average Priority Score'])
        
        st.markdown("**Table Sorted by Average Priority Score Across All Profiles**")
        st.dataframe(comparison_df.reset_index(drop=True), use_container_width=True)
    
# --- APP FLOW START: UNIVERSAL FILTERING ---

# --- Sidebar Filters (Filters apply once to create filtered_df) ---
st.sidebar.markdown("---")
st.sidebar.markdown("###  Data Filters (Universal)")

# 1. Engagement filter 
with st.sidebar.expander("Filter Engagement Classes", expanded=True):
    engagement_classes = df['CATEGORY'].dropna().unique().tolist()
    selected_engagement = [cls for cls in engagement_classes if st.checkbox(cls, value=True, key=f'eng_{cls}')]

filtered_df = df[df['CATEGORY'].isin(selected_engagement)].copy()

# 2. Product filter for Non-DC 
if 'Non-DC' in selected_engagement:
    non_dc_rows = filtered_df[filtered_df['CATEGORY'] == 'Non-DC']
    if not non_dc_rows.empty:
        with st.sidebar.expander("Filter SUB_CATEGORY for Non-DC", expanded=False):
            product_classes = non_dc_rows['SUB_CATEGORY'].dropna().unique().tolist()
            selected_products = [p for p in product_classes if st.checkbox(p, value=True, key=f'prod_{p}')]
        
        filter_non_dc = (filtered_df['CATEGORY'] == 'Non-DC')
        filter_product = (~filtered_df['SUB_CATEGORY'].isin(selected_products))
        filtered_df = filtered_df[~(filter_non_dc & filter_product)]


# 3. Additional Filters (PG Transaction)
st.sidebar.subheader("Additional Filters")
if 'PG Transaction' in df.columns:
    with st.sidebar.expander("Filter PG Transaction Status", expanded=True):
        pg_options = sorted(df['PG Transaction'].dropna().unique().astype(int).tolist())
        selected_pg_transactions = []
        
        if 0 in pg_options:
            if st.checkbox("Non-Transactional (0)", value=True, key='pg_trans_0_exp'):
                selected_pg_transactions.append(0)
        
        if 1 in pg_options:
            if st.checkbox("Transactional (1)", value=True, key='pg_trans_1_exp'):
                selected_pg_transactions.append(1)
            
        filtered_df = filtered_df[filtered_df['PG Transaction'].isin(selected_pg_transactions)].copy()


# 4. Satisfaction Filter (Toggle)
if 'NUM_RESPONSES' in df.columns:
    cei_toggle = st.sidebar.toggle("Require > 30 Sat. Responses", value=False, key='cei_count_toggle')
    
    if cei_toggle:
        filtered_df = filtered_df[filtered_df['NUM_RESPONSES'] >= 30]

# --- APP FLOW END: DYNAMIC WEIGHT PROFILES (Custom Sliders) ---


st.header('Adjust Feature Weights (Scale 0-5)')
col_add, col_remove, _ = st.columns([0.15, 0.15, 0.7])

# Buttons for adding/removing profiles remain outside the tabs
current_profile_count = len(st.session_state.weight_profiles)
MAX_PROFILES = 5 # Define your limit

# Add Button Logic (using session state count)
if current_profile_count < MAX_PROFILES:
    col_add.button(
        "➕ Add Profile", 
        on_click=add_profile, 
        use_container_width=True, 
        help=f"Add a new weighting profile (Max {MAX_PROFILES})."
    )
else:
    col_add.info(f"Maximum {MAX_PROFILES} profiles reached.")

# Remove Button Logic (using session state count)
# Only allow removal if there is more than 1 profile
if current_profile_count > 1:
    col_remove.button(
        "➖ Remove Last Profile", 
        on_click=remove_profile, 
        args=(current_profile_count - 1,), 
        use_container_width=True, 
        help="Remove the last profile added."
    )
else:
    # Ensure this section is displayed correctly if no button is shown
    if current_profile_count == 1:
        col_remove.info("min 1 profile needed")
    
st.markdown("<br>", unsafe_allow_html=True) 

# --- Dynamic Rendering Loop using Tabs ---
tab_names = [profile['name'] for profile in st.session_state.weight_profiles]
# Create the tabs dynamically based on the number of profiles
tabs = st.tabs(tab_names)

# Iterate through all weight profiles and render the sliders and results inside the corresponding tab
for i, profile in enumerate(st.session_state.weight_profiles):
    
    with tabs[i]:
        
        # 1. Render Sliders (1x4 Layout)
        slider_container = st.container()
        with slider_container:
            render_sliders(i, slider_container)
            
        st.markdown("---") 
        
        # 2. Display Results for this specific profile, using the universal filtered_df
        prioritized_df = calculate_priority_df(filtered_df, profile)
        display_priority_results(prioritized_df, profile)
        
# --- Comparison Mode Toggle ---
st.markdown("---") 

comparison_toggle = st.toggle("Activate Comparison Mode", value=False)

if comparison_toggle:
    display_comparison(filtered_df, st.session_state.weight_profiles)
    
st.markdown("---")

# --- Friendly names for actual columns ---
custom_names = {
    'VISITORS': 'Visitors',
    'PG Friction - # Calls within 7 days': 'Calls within 7 days',
    'Avg. AHT per call': 'Average Handle Time per Call (sec)',
    'Desktop Switch Rate': 'Rate of Switching to Desktop',
    'VISITS': 'Visits',
    'VISITS per Visitor': 'Average Visits per Visitor',
    'PG Friction - Switch to Desktop within 7 days': 'Desktop Switches (7 Days)',
    'Ease of Use - Top2Box': 'Ease of Use (Top 2 Box)',
    'CEI - Top2Box': 'Customer Experience Index (Top 2 Box)',
    'Call Rate': 'Call Rate (%)' 
}

# --- Data exploration setup now uses only raw columns ---
st.header(" Column-wise Data Exploration")

# Select plot type
st.subheader("Plot Configuration")
plot_type = st.selectbox("Select plot type", ["Bar (Top 10)", "Scatter"], key='plot_type_select')

base_columns = list(custom_names.keys())

# --- Scatter plot setup ---
if plot_type == "Scatter":
    st.markdown("##### Scatter Plot Configuration")
    
    # Preserve selections if possible
    if "selected_x_s" not in st.session_state: st.session_state["selected_x_s"] = base_columns[0]
    if "selected_y_s" not in st.session_state: st.session_state["selected_y_s"] = base_columns[1]
    
    selected_x = st.selectbox("Select column for X-axis", base_columns, index=base_columns.index(st.session_state["selected_x_s"]), key="scatter_x_s")
    selected_y = st.selectbox("Select column for Y-axis", base_columns, index=base_columns.index(st.session_state["selected_y_s"]), key="scatter_y_s")
    selected_size = st.selectbox("Select column for marker size (optional)", [None] + base_columns, key="scatter_size_s")
    selected_color = st.selectbox("Select column for marker color (optional)", [None] + base_columns, key="scatter_color_s")
    
    # Use raw column names and friendly names
    x_col = selected_x
    y_col = selected_y
    label_x = custom_names.get(selected_x)
    label_y = custom_names.get(selected_y)
    
    # Update session state for future selection preservation
    st.session_state["selected_x_s"] = selected_x
    st.session_state["selected_y_s"] = selected_y

# --- Single-variable plot setup (Bar) ---
else:
    st.markdown("##### Single Variable Configuration")
    if "selected_col_s" not in st.session_state: st.session_state["selected_col_s"] = base_columns[0]
    
    selected_col = st.selectbox("Select column for analysis", base_columns, index=base_columns.index(st.session_state["selected_col_s"]), key="selected_col_s")
    x_col = selected_col
    label_x = custom_names.get(selected_col)
    
    selected_x, selected_y, selected_size, selected_color = None, None, None, None


if st.button("Generate Plot"):
    
    # 1. Bar (Top 10)
    if plot_type == "Bar (Top 10)":
        plot_col = selected_col
        # NOTE: Need to decide if high or low is "better" for Top 10 display
        ascending_order = False # Assuming higher value is better/more impactful for 'Top 10'
        
        # Exception: For CEI/Ease of Use, show the bottom 10 (lowest scores)
        if 'Top2Box' in plot_col:
              ascending_order = True # Lowest CEI/Ease of Use are the 'worst' or 'most impactful'

        top_df_plot = df[['PAGE_GROUP', plot_col]].dropna().sort_values(by=plot_col, ascending=ascending_order).head(10)

        fig, ax = plt.subplots(figsize=(8, 6))
        ax.barh(top_df_plot['PAGE_GROUP'], top_df_plot[plot_col], color="darkorange")
        
        if 'Top2Box' in plot_col:
            title_prefix = "Bottom 10 Pages (Lowest Score) by"
        else:
            title_prefix = "Top 10 Pages (Highest Score) by"

        ax.set_title(f"{title_prefix} {label_x}", fontsize=14)
        ax.set_xlabel(label_x, fontsize=12)
        ax.invert_yaxis()
        plt.tight_layout()
        st.pyplot(fig)

    
    # 2. Scatter Plot 
    elif plot_type == "Scatter":
        
        cols_to_plot = [x_col, y_col]
        if selected_size: cols_to_plot.append(selected_size)
        if selected_color: cols_to_plot.append(selected_color)
        
        df_plot = df[['PAGE_GROUP'] + cols_to_plot].dropna().copy()
        
        size_col_name = None
        if selected_size:
            # Re-normalize size column for marker size visually
            df_plot['size_norm'] = (df_plot[selected_size] - df_plot[selected_size].min()) / (df_plot[selected_size].max() - df_plot[selected_size].min())
            df_plot['size_norm'] = df_plot['size_norm'] * 40 + 10 
            size_col_name = 'size_norm'
        
        color_col_name = selected_color


        if df_plot.empty:
            st.warning("Selected columns contain no valid data to plot.")
        else:
            # Fit regression
            X = df_plot[[x_col]]
            Y = df_plot[[y_col]]
            # Use .values.reshape(-1, 1) for single feature array required by sklearn
            model = LinearRegression()
            model.fit(X.values.reshape(-1, 1), Y.values.reshape(-1, 1)) 
            
            # Calculate R-squared
            r_sq = model.score(X.values.reshape(-1, 1), Y.values.reshape(-1, 1))
            st.info(f"The linear correlation ($R^2$) between {label_x} and {label_y} is: **{r_sq:.3f}**")
            
            x_vals = np.linspace(X.min().iloc[0], X.max().iloc[0], 100).reshape(-1, 1)
            y_vals = model.predict(x_vals)

            # Scatter plot with Plotly
            fig = px.scatter(
                df_plot,
                x=x_col,
                y=y_col,
                size=size_col_name,
                color=color_col_name if color_col_name else None,
                hover_name='PAGE_GROUP',
                title=f"{label_x} vs {label_y}",
                labels={x_col: label_x, y_col: label_y},
                color_continuous_scale="Viridis" if color_col_name else None
            )

            fig.update_traces(marker=dict(opacity=0.7))

            # Add regression line
            fig.add_scatter(
                x=x_vals.flatten(),
                y=y_vals.flatten(),
                mode='lines',

                name='Regression Line',
                line=dict(color='red', width=3)
            )

            st.plotly_chart(fig, use_container_width=True)
