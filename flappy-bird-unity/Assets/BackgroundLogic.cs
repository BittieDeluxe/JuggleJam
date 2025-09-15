using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class BackgroundLogic : MonoBehaviour
{
    // No Update method needed - background is now stationary as per Game Design Document
    // The background should remain static to match the soccer juggling theme

    void Start()
    {
        // Set the background to a fixed position
        // Position at z=0, same plane as other game objects
        transform.position = new Vector3(0, 0, 0);

        // Debug to verify the background is being set up
        Debug.Log("Background positioned at: " + transform.position);

        // Check if sprite renderer exists and is enabled
        SpriteRenderer sr = GetComponent<SpriteRenderer>();
        if (sr != null)
        {
            Debug.Log("Background SpriteRenderer found - Sprite: " + (sr.sprite != null ? sr.sprite.name : "NULL"));
            Debug.Log("Background SpriteRenderer enabled: " + sr.enabled);
            Debug.Log("Background sorting order: " + sr.sortingOrder);
        }
        else
        {
            Debug.LogError("No SpriteRenderer found on Background!");
        }
    }
}
