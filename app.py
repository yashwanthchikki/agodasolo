import pandas as pd
import streamlit as st
from PIL import Image
import numpy as np
import copy 
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

    col_title.markdown("<h1 style='color: #4CAF50; margin-bottom: 0px;'>NetBenefits Page Prioritization</h1>", unsafe_allow_html=True)
    col_title.markdown("App Page Prioritization Engine", unsafe_allow_html=True)

    try:
        image = Image.open("logo.png")
        resized_image = image.resize((500, 100)) 
        col_logo.image(resized_image, use_container_width=True) 
    except FileNotFoundError:
        col_logo.warning("Logo not found. Header is title-only.")
    except Exception as e:
        col_logo.warning(f"Could not load/resize logo: {e}")
    
    st.markdown("<hr style='border: 4px solid #4CAF50;'>", unsafe_allow_html=True) 

# --- configurations -------------------------------------------------------------------------------------
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

feature_groups = {
    "Volume & Engagement": {
        "pg_visitors": "VISITORS",
        "pg_visits": "VISITS",
        "visits_per_visitor_weight": "Visits_per_Visitor"
    },
    "Satisfaction & CX": { 
        "cei_top2box_weight": "CEI_TOPBOX",
        "ease_of_use_weight": "EASE_OF_USE_TOPBOX"
    },
    "Calls ": {
        "friction_calls_weight": "CALLS_7_DAYS",
        "aht_weight": "AVG_AHT",
        "call_rate_weight": "Call_Rate"
    },
    "Desktop Switch ": {
        "desktop_switch_rate_weight": "Desktop_switch_rate",
        "friction_desktop_7day_weight": "SWITCH_TO_DESKTOP"
    }
}

if "weight_profiles" not in st.session_state:
    st.session_state.weight_profiles = []

if not st.session_state.weight_profiles:
    st.session_state.weight_profiles.append({
        "name": "Profile 1 (Balanced)",
        **CONFIGURATIONS["Balanced"]
    })

# --- Functions ------------------------------------------------------------------------------------

def add_profile():
    new_index = len(st.session_state.weight_profiles) + 1
    new_profile = {
        "name": f"Profile {new_index} (Balanced)",
        **CONFIGURATIONS["Balanced"]
    }
    st.session_state.weight_profiles.append(new_profile)

def remove_profile(index_to_remove):
    if len(st.session_state.weight_profiles) > 1:
        st.session_state.weight_profiles.pop(index_to_remove)
    else:
        st.error("Cannot remove the last profile.")

def update_profile_weight(profile_index, key, new_value):
    st.session_state.weight_profiles[profile_index][key] = [new_value]

def render_sliders(profile_index, column_container):
    profile = st.session_state.weight_profiles[profile_index]
    slider_key_prefix = f'slider_temp_{profile_index}'

    def slider_callback(k):
        new_val = st.session_state[f'{slider_key_prefix}_{k}']
        update_profile_weight(profile_index, k, new_val)

    col_name, col_preset = column_container.columns([0.6, 0.4])
    new_name = col_name.text_input("Profile Name", profile["name"], key=f"name_{profile_index}")
    st.session_state.weight_profiles[profile_index]["name"] = new_name
    
    current_preset_name = st.session_state.get(f"last_preset_{profile_index}", "Balanced")
    preset_options = list(CONFIGURATIONS.keys())
    try:
        default_index = preset_options.index(current_preset_name)
    except ValueError:
        default_index = 0

    selected_preset = col_preset.selectbox("Apply Preset", preset_options, index=default_index, key=f"preset_{profile_index}")
    
    if current_preset_name != selected_preset:
        st.session_state[f"last_preset_{profile_index}"] = selected_preset
        new_weights = copy.deepcopy(CONFIGURATIONS[selected_preset])
        for key, value in new_weights.items():
             st.session_state.weight_profiles[profile_index][key] = value
        st.rerun() 

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
                        current_value = profile.get(key, [3])[0]
                        st.slider(label, 0, 5, current_value, key=f'{slider_key_prefix}_{key}', on_change=slider_callback, args=(key,))

def normalize(series):
    if series.empty or series.max() == series.min():
        return pd.Series(0.0, index=series.index)
    return (series - series.min()) / (series.max() - series.min())

def normalize_weights(weights_dict):
    weight_keys = list(BASE_CONFIG.keys())
    values = [weights_dict.get(k, [3])[0] for k in weight_keys] 
    min_val, max_val = min(values), max(values)
    if max_val == min_val:
        return {k: 1.0 for k in weight_keys} 
    return {k: (weights_dict.get(k, [3])[0] - min_val) / (max_val - min_val) for k in weight_keys}

def calculate_priority_df(df_input, weight_profile):
    w_df = df_input.copy()
    
    # 1. Normalization using New Case-Sensitive Names
    w_df['n_visitors'] = normalize(w_df['VISITORS'])
    w_df['n_visits'] = normalize(w_df['VISITS'])
    w_df['n_vpv'] = normalize(w_df['Visits_per_Visitor'])
    w_df['n_calls'] = normalize(w_df['CALLS_7_DAYS'])
    w_df['n_aht'] = normalize(w_df['AVG_AHT'])
    w_df['n_dsr'] = normalize(w_df['Desktop_switch_rate'])
    w_df['n_sw_desk'] = normalize(w_df['SWITCH_TO_DESKTOP'])
    w_df['n_call_rate'] = normalize(w_df['Call_Rate'])
    # Inverse satisfaction: Lower score = Higher priority
    w_df['n_cei'] = normalize(100 - w_df['CEI_TOPBOX'])
    w_df['n_eou'] = normalize(100 - w_df['EASE_OF_USE_TOPBOX'])
    
    nw = normalize_weights(weight_profile)
    
    # 2. Raw Priority Calculation
    w_df['RawPriority'] = (
        w_df['n_visitors'] * nw['pg_visitors'] +
        w_df['n_visits'] * nw['pg_visits'] +
        w_df['n_vpv'] * nw['visits_per_visitor_weight'] +
        w_df['n_calls'] * nw['friction_calls_weight'] +
        w_df['n_aht'] * nw['aht_weight'] +
        w_df['n_call_rate'] * nw['call_rate_weight'] + 
        w_df['n_dsr'] * nw['desktop_switch_rate_weight'] +
        w_df['n_sw_desk'] * nw['friction_desktop_7day_weight'] +
        w_df['n_eou'] * nw['ease_of_use_weight'] +
        w_df['n_cei'] * nw['cei_top2box_weight']
    )
    return w_df.sort_values(by='RawPriority', ascending=False)

def display_priority_results(working_df, weight_profile):
    # Mapping dataframe columns to readable display names
    feature_map = {
        'VISITORS': 'Visitors', 'VISITS': 'Visits', 'Visits_per_Visitor': 'Visits/Visitor',
        'CALLS_7_DAYS': 'Calls (7d)', 'AVG_AHT': 'Avg AHT', 'Call_Rate': 'Call Rate',
        'Desktop_switch_rate': 'Desktop Switch %', 'SWITCH_TO_DESKTOP': 'Switches (7d)',
        'EASE_OF_USE_TOPBOX': 'Ease of Use', 'CEI_TOPBOX': 'CEI'
    }
    output_cols = ['PAGE_GROUP'] + list(feature_map.keys()) + ['RawPriority']
    st.subheader(f' {weight_profile["name"]} - Prioritization Results')
    st.dataframe(working_df[output_cols].reset_index(drop=True), use_container_width=True)

# --- APP FLOW START ------------------------------------------------------------------------------------

# Sidebar Filters using New Names
st.sidebar.markdown("### Data Filters (Universal)")
if 'CATEGORY' in df.columns:
    with st.sidebar.expander("Filter Categories", expanded=True):
        cat_list = df['CATEGORY'].dropna().unique().tolist()
        sel_cat = [c for c in cat_list if st.checkbox(c, value=True, key=f'c_{c}')]
    filtered_df = df[df['CATEGORY'].isin(sel_cat)].copy()

if 'SUB_CATEGORY' in filtered_df.columns:
    with st.sidebar.expander("Filter Sub-Categories", expanded=False):
        sub_list = filtered_df['SUB_CATEGORY'].dropna().unique().tolist()
        sel_sub = [s for s in sub_list if st.checkbox(s, value=True, key=f's_{s}')]
    filtered_df = filtered_df[filtered_df['SUB_CATEGORY'].isin(sel_sub)]

if 'Transaction Flag' in df.columns:
    with st.sidebar.expander("Transaction Status", expanded=True):
        trans_opts = sorted(df['Transaction Flag'].dropna().unique().astype(int).tolist())
        sel_trans = [t for t in trans_opts if st.checkbox(f"Status {t}", value=True, key=f't_{t}')]
    filtered_df = filtered_df[filtered_df['Transaction Flag'].isin(sel_trans)]

if 'NUM_RESPONSES' in df.columns:
    if st.sidebar.toggle("Require > 30 Responses", value=False):
        filtered_df = filtered_df[filtered_df['NUM_RESPONSES'] >= 30]

# Weight UI
st.header('Adjust Feature Weights (Scale 0-5)')
col_add, col_remove, _ = st.columns([0.15, 0.15, 0.7])
if len(st.session_state.weight_profiles) < 5:
    col_add.button("➕ Add Profile", on_click=add_profile, use_container_width=True)
if len(st.session_state.weight_profiles) > 1:
    col_remove.button("➖ Remove Last", on_click=remove_profile, args=(len(st.session_state.weight_profiles)-1,), use_container_width=True)

tab_names = [p['name'] for p in st.session_state.weight_profiles]
tabs = st.tabs(tab_names)

for i, profile in enumerate(st.session_state.weight_profiles):
    with tabs[i]:
        render_sliders(i, st.container())
        st.markdown("---") 
        p_df = calculate_priority_df(filtered_df, profile)
        display_priority_results(p_df, profile)

# Exploration Section
st.markdown("---")
st.header("Column-wise Data Exploration")
custom_names = {
    'VISITORS': 'Visitors', 'CALLS_7_DAYS': 'Calls (7d)', 'AVG_AHT': 'Avg AHT (sec)',
    'Desktop_switch_rate': 'Desktop Switch Rate', 'VISITS': 'Visits',
    'Visits_per_Visitor': 'Visits per Visitor', 'SWITCH_TO_DESKTOP': 'Desktop Switches',
    'EASE_OF_USE_TOPBOX': 'Ease of Use Score', 'CEI_TOPBOX': 'CEI Score', 'Call_Rate': 'Call Rate %' 
}

plot_type = st.selectbox("Select plot type", ["Bar (Top 10)", "Scatter"])
base_cols = list(custom_names.keys())

if plot_type == "Bar (Top 10)":
    sel_col = st.selectbox("Select column", base_cols)
    if st.button("Generate Bar Plot"):
        # For satisfaction, show bottom 10 (lowest scores)
        asc = True if 'TOPBOX' in sel_col else False
        t10 = df[['PAGE_GROUP', sel_col]].dropna().sort_values(by=sel_col, ascending=asc).head(10)
        fig, ax = plt.subplots()
        ax.barh(t10['PAGE_GROUP'], t10[sel_col], color="darkorange")
        ax.set_title(f"{'Bottom' if asc else 'Top'} 10 - {custom_names[sel_col]}")
        ax.invert_yaxis()
        st.pyplot(fig)

elif plot_type == "Scatter":
    sx = st.selectbox("X-axis", base_cols, index=0)
    sy = st.selectbox("Y-axis", base_cols, index=1)
    if st.button("Generate Scatter Plot"):
        dfp = df[['PAGE_GROUP', sx, sy]].dropna()
        model = LinearRegression().fit(dfp[[sx]], dfp[[sy]])
        r2 = model.score(dfp[[sx]], dfp[[sy]])
        st.info(f"Linear Correlation ($R^2$): **{r2:.3f}**")
        fig = px.scatter(dfp, x=sx, y=sy, hover_name='PAGE_GROUP', title=f"{custom_names[sx]} vs {custom_names[sy]}")
        st.plotly_chart(fig, use_container_width=True)

st.markdown("---")
